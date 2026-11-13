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

/**
 * A Facebook Page post (M11).
 *
 * The simplest of the three: one call to `/{page-id}/feed` with the text, and the post exists. A photo is attached
 * by URL, which is why generated content keeps its `mediaUrl` as a Cloudinary link rather than a local file - Meta
 * fetches it itself.
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
    const { id } = await graphCall<{ id: string }>(
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
    return id;
  }

  /**
   * How the post did.
   *
   * Every figure is fetched so that a refusal costs only that figure. Meta hands these out behind three different
   * permissions, and an app rarely holds all of them: `shares` needs none, `likes.summary` needs
   * `pages_read_engagement`, and `comments.summary` needs `pages_read_user_content` - which Meta's own OAuth
   * dialog rejects as an invalid scope, so on a Page connected today comments are simply not obtainable. Asking
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
   * The three engagement counts: one call when the token may read all of them, otherwise one call each.
   *
   * The combined call is tried first because that is one request instead of three on a page where everything is
   * permitted, and the fallback only runs on the refusal.
   */
  private async counts(target: PublishTarget, postId: string) {
    const together = await this.field<CountsAnswer>(
      target,
      postId,
      'likes.summary(true),comments.summary(true),shares',
    );
    if (together) return shapeCounts(together);

    const [likes, comments, shares] = await Promise.all([
      this.field<CountsAnswer>(target, postId, 'likes.summary(true)'),
      this.field<CountsAnswer>(target, postId, 'comments.summary(true)'),
      this.field<CountsAnswer>(target, postId, 'shares'),
    ]);
    return {
      likes: shapeCounts(likes).likes,
      comments: shapeCounts(comments).comments,
      shares: shapeCounts(shares).shares,
    };
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
    likes: answer?.likes?.summary?.total_count ?? 0,
    comments: answer?.comments?.summary?.total_count ?? 0,
    shares: answer?.shares?.count ?? 0,
  };
}
