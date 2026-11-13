import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialPlatform } from '@stayreco/shared';
import type { Env } from '../../../config/env';
import { graphCall } from './graph-api';
import {
  type PostMetrics,
  platformUnsupported,
  type PublishablePost,
  type PublishTarget,
  type SocialPublisher,
} from './social-publisher';

/**
 * An Instagram post (M11).
 *
 * Two calls, not one: a media container is created from the image URL and the caption, and then published. There is
 * no text-only post on Instagram, so content with no `mediaUrl` is refused here rather than sent and rejected - the
 * staff member gets "attach a photo" instead of a Meta error code.
 */
@Injectable()
export class InstagramPublisher implements SocialPublisher {
  readonly platform = SocialPlatform.INSTAGRAM;
  private readonly version: string;

  constructor(config: ConfigService<Env, true>) {
    this.version = config.get('META_GRAPH_VERSION', { infer: true });
  }

  async publish(target: PublishTarget, post: PublishablePost): Promise<string> {
    if (!post.mediaUrl) {
      throw platformUnsupported(
        'Instagram',
        'it has no text-only post, so this content needs a photo first',
      );
    }
    const caption = post.title ? `${post.title}\n\n${post.body}` : post.body;

    const { id: creationId } = await graphCall<{ id: string }>(
      'Instagram',
      this.version,
      `${target.accountName}/media`,
      {
        access_token: target.accessToken,
        image_url: post.mediaUrl,
        caption,
      },
    );
    const { id } = await graphCall<{ id: string }>(
      'Instagram',
      this.version,
      `${target.accountName}/media_publish`,
      { access_token: target.accessToken, creation_id: creationId },
    );
    return id;
  }

  /** Instagram reports impressions on the media's own insights edge, alongside the engagement counts. */
  async metrics(
    target: PublishTarget,
    externalPostId: string,
  ): Promise<PostMetrics> {
    const counts = await graphCall<{
      like_count?: number;
      comments_count?: number;
    }>(
      'Instagram',
      this.version,
      externalPostId,
      { access_token: target.accessToken, fields: 'like_count,comments_count' },
      'GET',
    );

    let views = 0;
    try {
      const insights = await graphCall<{
        data?: { name?: string; values?: { value?: number }[] }[];
      }>(
        'Instagram',
        this.version,
        `${externalPostId}/insights`,
        { access_token: target.accessToken, metric: 'impressions' },
        'GET',
      );
      views = insights.data?.[0]?.values?.[0]?.value ?? 0;
    } catch {
      views = 0;
    }

    return {
      views,
      likes: counts.like_count ?? 0,
      comments: counts.comments_count ?? 0,
      // Instagram has no share count on a feed post; zero is the honest answer, not a missing one.
      shares: 0,
    };
  }
}
