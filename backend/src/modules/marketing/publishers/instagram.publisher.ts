import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialPlatform } from '@stayreco/shared';
import type { Env } from '../../../config/env';
import { graphCall } from './graph-api';
import {
  type PostMetrics,
  platformUnsupported,
  publishFailed,
  type PublishablePost,
  type PublishTarget,
  type SocialPublisher,
} from './social-publisher';

/** How many times, and how often, to ask whether Instagram has finished preparing a picture: 20 seconds at most. */
const CONTAINER_CHECKS = 10;
const CONTAINER_CHECK_MS = 2_000;

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
    await this.untilReady(target, creationId);
    const { id } = await graphCall<{ id: string }>(
      'Instagram',
      this.version,
      `${target.accountName}/media_publish`,
      { access_token: target.accessToken, creation_id: creationId },
    );
    return id;
  }

  /**
   * Waits for Instagram to finish preparing the container before it is published.
   *
   * Instagram fetches the picture and processes it after the container is created; publishing before that answers
   * "Media ID is not available" and the post fails for nothing but timing. Meta's own guide asks for `status_code` to
   * be `FINISHED` first. A container that comes back `ERROR` or `EXPIRED` will never finish, so it fails at once with
   * that reason rather than after the last attempt.
   */
  private async untilReady(target: PublishTarget, creationId: string) {
    for (let attempt = 0; attempt < CONTAINER_CHECKS; attempt++) {
      const { status_code: status } = await graphCall<{
        status_code?: string;
      }>(
        'Instagram',
        this.version,
        creationId,
        { access_token: target.accessToken, fields: 'status_code' },
        'GET',
      );
      if (status === 'FINISHED') return;
      if (status === 'ERROR' || status === 'EXPIRED') {
        throw publishFailed(
          'Instagram',
          `it could not prepare the picture (${status}); check that the image link opens`,
        );
      }
      await this.pause(CONTAINER_CHECK_MS);
    }
    throw publishFailed(
      'Instagram',
      `the picture was still being prepared after ${(CONTAINER_CHECKS * CONTAINER_CHECK_MS) / 1000} seconds`,
    );
  }

  /** Overridden by the tests, which have no reason to wait. */
  protected pause(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Instagram reports views on the media's own insights edge, alongside the engagement counts. The metric is
   * `views`: Meta retired `impressions` for Instagram media, and asking for it answers an error that the `catch`
   * below would turn into a silent, permanent zero - the same trap as `post_impressions` on Facebook (M17).
   */
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
        { access_token: target.accessToken, metric: 'views' },
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
