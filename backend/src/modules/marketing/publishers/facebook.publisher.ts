import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialPlatform } from '@stayreco/shared';
import type { Env } from '../../../config/env';
import { graphCall } from './graph-api';
import type {
  PostMetrics,
  PublishablePost,
  PublishTarget,
  SocialPublisher,
} from './social-publisher';

/** The comment total without the comments: readable with `pages_read_engagement` (see `metrics`). */
const COMMENT_COUNT = 'comments.limit(0).summary(true)';
/**
 * Likes are read as reactions (like, love, haha...): on a Page post node Graph v26 has no `likes` field at all
 * ("Tried accessing nonexisting field"). `likes` remains on a photo node, which is what a photo post's id pointed
 * at until 2026-11-28, so it is the fallback for those rows.
 */
const REACTION_COUNT = 'reactions.limit(0).summary(true)';
const LIKE_COUNT = 'likes.limit(0).summary(true)';

/**
 * A Facebook Page post (M11).
 *
 * The simplest of the three: one call to `/{page-id}/feed` with the text, and the post exists. A photo is attached
 * by URL, which is why generated content keeps its `mediaUrl` as a Cloudinary link rather than a local file - Meta
 * fetches it itself.
 *
 * A photo post answers two ids: the photo's (`id`) and the post's (`post_id`). The post's is the one kept, because
 * the figures belong to the post: a photo has no `shares` at all ("Tried accessing nonexisting field"), so keeping
 * the photo's id made every shared photo post read 0 shares (found on a live post, 2026-11-28).
 */
@Injectable()
export class FacebookPublisher implements SocialPublisher {
  readonly platform = SocialPlatform.FACEBOOK;
  private readonly version: string;

  constructor(config: ConfigService<Env, true>) {
    this.version = config.get('META_GRAPH_VERSION', { infer: true });
  }

  async publish(target: PublishTarget, post: PublishablePost): Promise<string> {
    // The title is prepended rather than sent separately: a Page post has one text field, not a headline and a body.
    const message = post.title ? `${post.title}\n\n${post.body}` : post.body;
    const answer = await graphCall<{ id: string; post_id?: string }>(
      'Facebook',
      this.version,
      `${target.accountName}/${post.mediaUrl ? 'photos' : 'feed'}`,
      {
        access_token: target.accessToken,
        ...(post.mediaUrl
          ? { url: post.mediaUrl, caption: message }
          : { message }),
      },
    );
    return answer.post_id ?? answer.id;
  }

  /**
   * How the post did.
   *
   * Every figure is fetched so that a refusal costs only that figure. Meta hands these out behind three different
   * permissions, and an app rarely holds all of them: `shares` needs none, the reaction count needs
   * `pages_read_engagement`, and the comments themselves need `pages_read_user_content`, which Meta's own OAuth
   * dialog rejects as an invalid scope. The comment *count* does not: `comments.limit(0).summary(true)` asks for
   * the total and no comment, and a Page token with `pages_read_engagement` may read it (checked against the live
   * API on 2026-11-28). Without `limit(0)` Meta fetches the comments too, and refuses the whole field. Asking
   * for all three in one call, as this used to, meant one forbidden figure took the other two with it and a post
   * with real shares reported nothing.
   *
   * A figure we are refused is reported as zero, the same as a brand-new post with no activity. That is the
   * convention the schema allows, and it is why the API documents a column of zeroes as "check the token's
   * scopes" rather than "nobody engaged". A refresh must never be the thing that breaks a published post's row.
   */
  async metrics(
    target: PublishTarget,
    externalPostId: string,
  ): Promise<PostMetrics> {
    const [counts, views] = await Promise.all([
      this.counts(target, externalPostId),
      this.views(target, externalPostId),
    ]);
    return { views, ...counts };
  }

  /**
   * The three engagement counts, read at the stored id and, if Meta refuses every one of them there, at the id the
   * post's own link names.
   *
   * A Page on Facebook's new Pages experience answers to more than one id. Asked as `{page-id}_{post}` (the id the
   * page token posts under, and the one stored), Meta may refuse the reactions and comments for want of
   * `pages_read_user_content`, yet answer the same fields for the same post asked as `{owner}_{post}`, the id in its
   * `permalink_url` - which is readable either way. Seen on a live post, 2026-11-28: refused under one id, one
   * reaction and one comment under the other.
   */
  private async counts(target: PublishTarget, postId: string) {
    const first = await this.countsAt(target, postId);
    if (first.readable) return first.counts;
    const alias = await this.permalinkId(target, postId);
    if (!alias) return first.counts;
    const second = await this.countsAt(target, alias);
    return second.readable ? second.counts : first.counts;
  }

  /**
   * The counts at one id: one call when the token may read all of them, otherwise one call each. `readable` says
   * whether Meta answered the reactions or comments at all, as opposed to refusing both.
   *
   * The combined call is tried first because that is one request instead of three on a page where everything is
   * permitted, and the fallback only runs on the refusal.
   */
  private async countsAt(target: PublishTarget, postId: string) {
    const together = await this.field<CountsAnswer>(
      target,
      postId,
      `${REACTION_COUNT},${COMMENT_COUNT},shares`,
    );
    if (together) return { readable: true, counts: shapeCounts(together) };

    const [reactions, comments, shares] = await Promise.all([
      this.field<CountsAnswer>(target, postId, REACTION_COUNT),
      this.field<CountsAnswer>(target, postId, COMMENT_COUNT),
      this.field<CountsAnswer>(target, postId, 'shares'),
    ]);
    // A photo id (posts stored before 2026-11-28) has likes and no reactions.
    const likes =
      reactions ?? (await this.field<CountsAnswer>(target, postId, LIKE_COUNT));
    return {
      readable: likes !== null || comments !== null,
      counts: {
        likes: shapeCounts(likes).likes,
        comments: shapeCounts(comments).comments,
        shares: shapeCounts(shares).shares,
      },
    };
  }

  /** `{owner}_{post}` from the post's own link, when it differs from the id asked with; null otherwise. */
  private async permalinkId(target: PublishTarget, postId: string) {
    const answer = await this.field<{ permalink_url?: string }>(
      target,
      postId,
      'permalink_url',
    );
    const match = answer?.permalink_url?.match(
      /facebook\.com\/(\d+)\/posts\/(\d+)/,
    );
    const alias = match ? `${match[1]}_${match[2]}` : null;
    return alias && alias !== postId ? alias : null;
  }

  /**
   * Impressions, which live on their own edge.
   *
   * `post_impressions` was retired in June 2026 across every API version; `post_media_view` is what replaced it.
   * The old name did not start failing loudly - it answers "must be a valid insights metric", which the catch
   * below turned into a permanent zero. That is why the metric name is pinned here with the date it changed.
   */
  private async views(target: PublishTarget, postId: string): Promise<number> {
    const insights = await this.read<InsightsAnswer>(
      target,
      `${postId}/insights`,
      { metric: 'post_media_view' },
    );
    return insights?.data?.[0]?.values?.[0]?.value ?? 0;
  }

  /** One `fields=` read of the post, or null if Meta refused it. */
  private field<T>(target: PublishTarget, postId: string, fields: string) {
    return this.read<T>(target, postId, { fields });
  }

  /** A read that answers null instead of throwing: the caller wants a figure, not an exception. */
  private async read<T>(
    target: PublishTarget,
    path: string,
    params: Record<string, string>,
  ): Promise<T | null> {
    try {
      return await graphCall<T>(
        'Facebook',
        this.version,
        path,
        { access_token: target.accessToken, ...params },
        'GET',
      );
    } catch {
      return null;
    }
  }
}

interface CountsAnswer {
  reactions?: { summary?: { total_count?: number } };
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
}

interface InsightsAnswer {
  data?: { values?: { value?: number }[] }[];
}

/** Meta leaves a field out entirely when it is zero, so a missing count and a count of zero are the same thing. */
function shapeCounts(answer: CountsAnswer | null) {
  return {
    likes:
      answer?.reactions?.summary?.total_count ??
      answer?.likes?.summary?.total_count ??
      0,
    comments: answer?.comments?.summary?.total_count ?? 0,
    shares: answer?.shares?.count ?? 0,
  };
}
