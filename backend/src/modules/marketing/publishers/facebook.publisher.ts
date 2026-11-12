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
   * Three of the four numbers come off the post itself with summary counts; impressions are an insight and live on
   * a different edge, so this is two calls. Insights can be missing - a brand-new post, or a Page without the
   * permission - and that is reported as zero views rather than as a failure, because a metrics refresh must never
   * be the thing that breaks a published post's row.
   */
  async metrics(
    target: PublishTarget,
    externalPostId: string,
  ): Promise<PostMetrics> {
    const counts = await graphCall<{
      likes?: { summary?: { total_count?: number } };
      comments?: { summary?: { total_count?: number } };
      shares?: { count?: number };
    }>(
      'Facebook',
      this.version,
      externalPostId,
      {
        access_token: target.accessToken,
        fields: 'likes.summary(true),comments.summary(true),shares',
      },
      'GET',
    );

    let views = 0;
    try {
      const insights = await graphCall<{
        data?: { values?: { value?: number }[] }[];
      }>(
        'Facebook',
        this.version,
        `${externalPostId}/insights`,
        { access_token: target.accessToken, metric: 'post_impressions' },
        'GET',
      );
      views = insights.data?.[0]?.values?.[0]?.value ?? 0;
    } catch {
      views = 0;
    }

    return {
      views,
      likes: counts.likes?.summary?.total_count ?? 0,
      comments: counts.comments?.summary?.total_count ?? 0,
      shares: counts.shares?.count ?? 0,
    };
  }
}
