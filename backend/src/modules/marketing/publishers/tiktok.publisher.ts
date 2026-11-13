import { Injectable } from '@nestjs/common';
import { SocialPlatform } from '@stayreco/shared';
import {
  type PostMetrics,
  platformUnsupported,
  type SocialPublisher,
} from './social-publisher';

/**
 * TikTok, deliberately not built (decision M12).
 *
 * TikTok's Content Posting API takes a video and nothing else: there is no text post, and no photo-only post
 * outside the separate photo-mode endpoint. The AI writer produces words. Until the hotel can upload a video and
 * the content model carries one, a TikTok publisher would be a method that always fails.
 *
 * It exists as a class rather than a gap in the registry so the failure is a single clear 501 with the reason in
 * it, instead of "no publisher for TIKTOK" from somewhere inside the job. A hotel can still connect a TikTok
 * account and schedule for it; what it gets is a row that says why, which is the information the next phase needs.
 */
@Injectable()
export class TiktokPublisher implements SocialPublisher {
  readonly platform = SocialPlatform.TIKTOK;

  private refuse(): never {
    throw platformUnsupported(
      'TikTok',
      'its posting API takes a video, and the AI writer produces text',
    );
  }

  // Neither takes its arguments: a method that refuses has no use for them, and a method with fewer parameters
  // still satisfies the interface.
  publish(): Promise<string> {
    this.refuse();
  }

  metrics(): Promise<PostMetrics> {
    this.refuse();
  }
}
