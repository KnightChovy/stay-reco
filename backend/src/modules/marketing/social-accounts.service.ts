import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ConnectSocialAccountInput,
  SocialAccount,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { FieldCipher } from '../../common/crypto/field-cipher';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Env } from '../../config/env';
import type { SocialAccount as SocialAccountRow } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import type { PublishTarget } from './publishers/social-publisher';

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.SOCIAL_ACCOUNT_NOT_FOUND,
    message: 'Social account not found',
  });

/** True while the token is still worth trying. A null expiry means the platform did not say, so we try. */
const isUsable = (row: SocialAccountRow, now = new Date()) =>
  row.expiresAt === null || row.expiresAt.getTime() > now.getTime();

const toAccount = (row: SocialAccountRow, now = new Date()): SocialAccount => ({
  id: row.socialAccountId,
  hotelId: row.hotelId,
  platform: row.platform,
  accountName: row.accountName,
  expiresAt: row.expiresAt?.toISOString() ?? null,
  usable: isUsable(row, now),
  createdAt: row.createdAt.toISOString(),
});

/**
 * The social pages a hotel has connected (M11).
 *
 * The access token is encrypted at rest with the same `FieldCipher` as a beneficiary account number, and never
 * leaves this service: it is read only to hand to a publisher. A page token can post as the hotel for months, so a
 * leaked database row is a leaked ability to post under the hotel's name - that is worth the same treatment as
 * banking details, and it is the reason `SocialAccount` has no token field at all.
 *
 * Tokens are pasted rather than obtained through OAuth. Meta reviews an app for weeks before it may post on a page
 * it does not own; a long-lived page token is the same credential by a slower route, so everything downstream can
 * be finished and shown now, and the OAuth screen is the only part left when the app is approved (decision M11).
 */
@Injectable()
export class SocialAccountsService {
  private readonly cipher: FieldCipher;

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
    config: ConfigService<Env, true>,
  ) {
    this.cipher = new FieldCipher(
      config.get('BENEFICIARY_ENCRYPTION_KEY', { infer: true }),
    );
  }

  /** `hotelId` was checked by `HotelAccessRequired('owner')`: connecting a page is not a staff decision. */
  async connect(
    user: AuthUser,
    hotelId: string,
    input: ConnectSocialAccountInput,
    meta: RequestMeta = {},
  ): Promise<SocialAccount> {
    const row = await this.prisma.socialAccount.create({
      data: {
        hotelId,
        platform: input.platform,
        accountName: input.accountName,
        accessToken: this.cipher.encrypt(input.accessToken),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    await this.audit.log(
      AuditAction.SOCIAL_ACCOUNT_CONNECTED,
      user.accountId,
      meta,
      // The platform and the page id, never the token.
      { hotelId, platform: input.platform, accountName: input.accountName },
    );
    return toAccount(row);
  }

  async list(hotelId: string): Promise<SocialAccount[]> {
    const rows = await this.prisma.socialAccount.findMany({
      where: { hotelId },
      orderBy: [{ platform: 'asc' }, { createdAt: 'asc' }],
    });
    const now = new Date();
    return rows.map((r) => toAccount(r, now));
  }

  /**
   * Disconnects a page, and cancels whatever was still waiting to go out on it.
   *
   * The account row is kept rather than deleted: a published post's schedule row points at it, and that record of
   * what went out under the hotel's name should survive the page being disconnected. Clearing the token is what
   * makes it unusable, and it is done in the same transaction as the cancellations so nothing can be published by
   * a job that read the row a moment earlier.
   */
  async disconnect(
    user: AuthUser,
    accountId: string,
    meta: RequestMeta = {},
  ): Promise<void> {
    const account = await this.owned(user, accountId);
    await this.prisma.$transaction([
      this.prisma.contentSchedule.updateMany({
        where: { socialAccountId: accountId, status: 'SCHEDULED' },
        data: {
          status: 'CANCELLED',
          failureReason: 'The page was disconnected',
        },
      }),
      this.prisma.socialAccount.update({
        where: { socialAccountId: accountId },
        data: { accessToken: null, refreshToken: null, expiresAt: new Date(0) },
      }),
    ]);
    await this.audit.log(
      AuditAction.SOCIAL_ACCOUNT_DISCONNECTED,
      user.accountId,
      meta,
      { accountId, platform: account.platform },
    );
  }

  /**
   * The page as a publisher needs it, token decrypted. Resolves to null when the account can no longer post, so a
   * caller can skip it rather than treat a known-dead token as a platform failure.
   */
  async targetFor(accountId: string): Promise<PublishTarget | null> {
    const row = await this.prisma.socialAccount.findUnique({
      where: { socialAccountId: accountId },
    });
    if (!row?.accessToken || !isUsable(row)) return null;
    return {
      platform: row.platform,
      accountName: row.accountName,
      accessToken: this.cipher.decrypt(row.accessToken),
    };
  }

  /** The account, checked to belong to a hotel the caller owns. */
  private async owned(user: AuthUser, accountId: string) {
    const account = isUuid(accountId)
      ? await this.prisma.socialAccount.findUnique({
          where: { socialAccountId: accountId },
        })
      : null;
    await this.access.assertResource(user, account?.hotelId, 'owner', notFound);
    return account!;
  }
}
