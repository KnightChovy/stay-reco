import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type {
  FacebookAuthorize,
  FacebookConnectInput,
  FacebookExchange,
  FacebookPage,
  SocialAccount,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { FieldCipher } from '../../common/crypto/field-cipher';
import { ErrorCode } from '../../common/errors/error-code';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { graphCall } from './publishers/graph-api';
import { SocialAccountsService } from './social-accounts.service';

/**
 * What Facebook is asked for. Each one is a thing the hotel sees the result of, and nothing more:
 * `pages_show_list` to name the pages at all, `pages_manage_posts` to publish, `pages_read_engagement` for likes
 * and comments, `read_insights` for the view count, and the two Instagram scopes only because one token serves
 * both platforms. An owner who declines a scope gets a page list that works for less, not an error.
 */
const SCOPES = [
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'read_insights',
  'instagram_basic',
  'instagram_content_publish',
] as const;

/** How long the owner has to finish the trip to Facebook and back. Long enough to read a consent screen twice. */
const STATE_TTL_MS = 15 * 60_000;

/** How long they then have to pick pages. The user token behind it lives for 60 days; this handle does not. */
const CONNECTION_TTL_MS = 10 * 60_000;

/** The signed payload that travels to Facebook and back, and the one that stands in for the user token. */
interface Sealed {
  /** Which flow this is, so a `state` can never be presented where a `connectionToken` is expected. */
  kind: 'state' | 'connection';
  /** The hotel the owner started from. Checked against the path, so a code cannot be replayed onto another hotel. */
  hotelId: string;
  /** Expiry in epoch milliseconds. */
  exp: number;
  /** Makes every value unique even for the same hotel in the same millisecond. */
  nonce: string;
  /** The long-lived user token, on a `connection` only. */
  userToken?: string;
}

interface TokenAnswer {
  access_token?: string;
}

interface PageAnswer {
  data?: {
    id?: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: { id?: string };
  }[];
}

/** A page Facebook says the owner administers, once we have checked it is usable. */
interface GrantedPage {
  pageId: string;
  name: string;
  token: string;
  instagramId: string | null;
}

const disabled = () =>
  new ServiceUnavailableException({
    code: ErrorCode.SOCIAL_OAUTH_DISABLED,
    message:
      'Connecting a page through Facebook is not configured on this server. A page token can still be pasted in by hand.',
  });

const invalid = (why: string) =>
  new BadRequestException({
    code: ErrorCode.SOCIAL_OAUTH_INVALID,
    message: why,
  });

const failed = (why: string) =>
  new BadGatewayException({
    code: ErrorCode.SOCIAL_OAUTH_FAILED,
    message: why,
  });

/** Pulls the message out of whatever `graphCall` threw, so Facebook's own words survive the code change. */
function reasonOf(err: unknown): string {
  if (err instanceof BadGatewayException) {
    const body = err.getResponse();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      return String(body.message);
    }
  }
  return err instanceof Error ? err.message : 'Facebook could not be reached';
}

/**
 * The owner-facing way to connect a page: three steps, no token ever typed or seen (M16).
 *
 * Pasting a page token works and is kept, because it needs no Meta app at all - but it asks a hotel owner to open
 * Graph API Explorer, grant six scopes and copy a credential out of a JSON response, which is not something to ask
 * of a customer. This service does those same calls on their behalf:
 *
 * 1. `authorize` hands back a Facebook URL carrying a signed `state`.
 * 2. Facebook sends the browser back to the frontend with a one-time `code`; the page the owner lands on posts it
 *    to `exchange`, which turns it into a long-lived user token and lists the pages they administer.
 * 3. `connect` stores a page token for each page the owner picked.
 *
 * Why the browser posts the code back instead of Facebook redirecting to an API route: a redirect carries no
 * `Authorization` header, so a `GET /callback` would arrive unauthenticated and have to trust `state` alone for
 * identity. Posting from the frontend keeps the request inside the owner's own session, and leaves `state` doing
 * only what it is good at - proving the flow is the one we started, for the hotel we started it for.
 *
 * Nothing here holds a token in memory between requests, and no table was added for the flow: both intermediate
 * values are encrypted with the same `FieldCipher` as the stored tokens and handed to the client as opaque
 * strings. A `connectionToken` is therefore useless to anyone who cannot decrypt it, and stops working in ten
 * minutes even for us.
 *
 * In Development mode a Meta app may do all of this for anyone holding a role in it (Admin, Developer, Tester) on
 * the pages they administer - so this flow is real and demonstrable before App Review. Review and Business
 * Verification are what open it to hotels outside the app, and need a legal entity rather than more code.
 */
@Injectable()
export class FacebookOauthService {
  private readonly cipher: FieldCipher;
  private readonly appId?: string;
  private readonly appSecret?: string;
  private readonly redirectUri?: string;
  private readonly version: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: SocialAccountsService,
    private readonly audit: AuditService,
    config: ConfigService<Env, true>,
  ) {
    this.cipher = new FieldCipher(
      config.get('BENEFICIARY_ENCRYPTION_KEY', { infer: true }),
    );
    this.appId = config.get('META_APP_ID', { infer: true });
    this.appSecret = config.get('META_APP_SECRET', { infer: true });
    this.redirectUri = config.get('META_OAUTH_REDIRECT_URI', { infer: true });
    this.version = config.get('META_GRAPH_VERSION', { infer: true });
  }

  /** True when the server can run the flow at all. The endpoints answer 503 rather than a Facebook error if not. */
  get configured(): boolean {
    return Boolean(this.appId && this.appSecret && this.redirectUri);
  }

  /** Step one. `hotelId` was checked by `HotelAccessRequired('owner')`. */
  authorize(hotelId: string): FacebookAuthorize {
    const app = this.app();
    const params = new URLSearchParams({
      client_id: app.appId,
      redirect_uri: app.redirectUri,
      scope: SCOPES.join(','),
      response_type: 'code',
      state: this.seal({ kind: 'state', hotelId, ttl: STATE_TTL_MS }),
    });
    return {
      authorizeUrl: `https://www.facebook.com/${this.version}/dialog/oauth?${params.toString()}`,
    };
  }

  /**
   * Step two: Facebook's one-time code becomes a long-lived user token, and that token names the pages.
   *
   * The code exchange already returns a user token, and it is exchanged again through `fb_exchange_token` rather
   * than trusted to be long-lived: a page token inherits its lifetime from the user token it was read with, and
   * the difference between a page token that never expires and one that dies in an hour does not show up until a
   * post silently stops going out. One extra call buys certainty.
   */
  async exchange(
    hotelId: string,
    code: string,
    state: string,
  ): Promise<FacebookExchange> {
    const app = this.app();
    this.open(state, 'state', hotelId);

    // Meta documents this exchange as a GET, so that is how it is called. The secret is in the URL of a
    // server-to-server request that is never logged and never reaches a browser.
    const short = await this.call<TokenAnswer>('oauth/access_token', {
      client_id: app.appId,
      client_secret: app.appSecret,
      redirect_uri: app.redirectUri,
      code,
    });
    if (!short.access_token) throw failed('Facebook returned no access token');

    const long = await this.call<TokenAnswer>('oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: app.appId,
      client_secret: app.appSecret,
      fb_exchange_token: short.access_token,
    });
    const userToken = long.access_token ?? short.access_token;

    const granted = await this.pages(userToken);
    const existing = await this.prisma.socialAccount.findMany({
      where: {
        hotelId,
        platform: 'FACEBOOK',
        accountName: { in: granted.map((p) => p.pageId) },
        accessToken: { not: null },
      },
      select: { accountName: true },
    });
    const connected = new Set(existing.map((row) => row.accountName));

    const expiresAt = new Date(Date.now() + CONNECTION_TTL_MS);
    return {
      connectionToken: this.seal({
        kind: 'connection',
        hotelId,
        ttl: CONNECTION_TTL_MS,
        userToken,
      }),
      expiresAt: expiresAt.toISOString(),
      pages: granted.map((p): FacebookPage => ({
        pageId: p.pageId,
        name: p.name,
        instagramId: p.instagramId,
        connected: connected.has(p.pageId),
      })),
    };
  }

  /**
   * Step three: store a page token for each page the owner picked.
   *
   * The pages are read from Facebook again rather than carried along from step two. It keeps page tokens out of
   * anything the browser holds, and it means a page the owner removed our app from in between is simply not in the
   * answer - which is the same as never having been granted, and better than storing a token already revoked.
   */
  async connect(
    user: AuthUser,
    hotelId: string,
    input: FacebookConnectInput,
    meta: RequestMeta = {},
  ): Promise<SocialAccount[]> {
    const { userToken } = this.open(
      input.connectionToken,
      'connection',
      hotelId,
    );
    if (!userToken)
      throw invalid('That connection cannot be used. Start again.');

    const granted = await this.pages(userToken);
    const byId = new Map(granted.map((p) => [p.pageId, p]));

    // Everything is checked before anything is written: half a connection is worse than none.
    const chosen = input.pages.map((pick) => {
      const page = byId.get(pick.pageId);
      if (!page) {
        throw invalid(
          `Facebook did not grant this app access to page ${pick.pageId}. Connect again and tick it on the consent screen.`,
        );
      }
      if (pick.instagram && !page.instagramId) {
        throw invalid(
          `Page "${page.name}" has no Instagram Business account linked to it, so Instagram cannot be connected from it.`,
        );
      }
      return { page, instagram: pick.instagram };
    });

    const saved: SocialAccount[] = [];
    for (const { page, instagram } of chosen) {
      saved.push(
        await this.accounts.upsert(hotelId, {
          platform: 'FACEBOOK',
          accountName: page.pageId,
          accessToken: page.token,
        }),
      );
      if (instagram && page.instagramId) {
        // The same page token publishes to Instagram: the account is reached through the page, not on its own.
        saved.push(
          await this.accounts.upsert(hotelId, {
            platform: 'INSTAGRAM',
            accountName: page.instagramId,
            accessToken: page.token,
          }),
        );
      }
    }

    await this.audit.log(
      AuditAction.SOCIAL_ACCOUNT_CONNECTED,
      user.accountId,
      meta,
      // Which pages, how, and never the tokens.
      {
        hotelId,
        via: 'facebook-oauth',
        accounts: saved.map((a) => ({
          platform: a.platform,
          accountName: a.accountName,
        })),
      },
    );
    return saved;
  }

  /**
   * The pages the owner administers, with their tokens, in one call.
   *
   * A page with no `access_token` is dropped: the owner holds a role on it that cannot publish, and offering it
   * would only produce a post that fails later for a reason nobody can see here.
   */
  private async pages(userToken: string): Promise<GrantedPage[]> {
    const answer = await this.call<PageAnswer>('me/accounts', {
      fields: 'id,name,access_token,instagram_business_account',
      limit: '100',
      access_token: userToken,
    });
    const pages = (answer.data ?? []).flatMap((row): GrantedPage[] =>
      row.id && row.access_token
        ? [
            {
              pageId: row.id,
              name: row.name ?? row.id,
              token: row.access_token,
              instagramId: row.instagram_business_account?.id ?? null,
            },
          ]
        : [],
    );
    if (pages.length === 0) {
      throw failed(
        'No Facebook Page came back for this account. A page the account administers is needed, and it has to be granted on the consent screen.',
      );
    }
    return pages;
  }

  private async call<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    try {
      return await graphCall<T>('Facebook', this.version, path, params, 'GET');
    } catch (err) {
      throw failed(reasonOf(err));
    }
  }

  private app() {
    if (!this.appId || !this.appSecret || !this.redirectUri) throw disabled();
    return {
      appId: this.appId,
      appSecret: this.appSecret,
      redirectUri: this.redirectUri,
    };
  }

  private seal(input: {
    kind: Sealed['kind'];
    hotelId: string;
    ttl: number;
    userToken?: string;
  }): string {
    const payload: Sealed = {
      kind: input.kind,
      hotelId: input.hotelId,
      exp: Date.now() + input.ttl,
      nonce: randomUUID(),
      ...(input.userToken && { userToken: input.userToken }),
    };
    return this.cipher.encrypt(JSON.stringify(payload));
  }

  /**
   * Opens one of our own sealed values, or refuses.
   *
   * Decryption failing is the signature check: the value was not produced by this server. The rest guards against
   * a value that is ours but is being used somewhere it should not be - the wrong step of the flow, a hotel the
   * owner also owns but did not start from, or a trip to Facebook abandoned an hour ago.
   */
  private open(sealed: string, kind: Sealed['kind'], hotelId: string): Sealed {
    let payload: Sealed;
    try {
      payload = JSON.parse(this.cipher.decrypt(sealed)) as Sealed;
    } catch {
      throw invalid(
        'That Facebook connection is not one we started. Start again.',
      );
    }
    if (payload.kind !== kind || payload.hotelId !== hotelId) {
      throw invalid(
        'That Facebook connection was started for a different hotel. Start again.',
      );
    }
    if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) {
      throw invalid('That Facebook connection has expired. Start again.');
    }
    return payload;
  }
}
