import { Injectable } from '@nestjs/common';
import type { SocialPlatform } from '@stayreco/shared';
import { FacebookPublisher } from './facebook.publisher';
import { InstagramPublisher } from './instagram.publisher';
import type { SocialPublisher } from './social-publisher';
import { TiktokPublisher } from './tiktok.publisher';

/**
 * The publisher for a platform.
 *
 * Every platform in the enum has one, TikTok included, so a lookup cannot come back empty and no caller needs a
 * fallback branch. Adding a platform is a class and one line here.
 */
@Injectable()
export class PublisherRegistry {
  private readonly byPlatform: Map<SocialPlatform, SocialPublisher>;

  constructor(
    facebook: FacebookPublisher,
    instagram: InstagramPublisher,
    tiktok: TiktokPublisher,
  ) {
    this.byPlatform = new Map(
      [facebook, instagram, tiktok].map((p) => [p.platform, p]),
    );
  }

  for(platform: SocialPlatform): SocialPublisher {
    const publisher = this.byPlatform.get(platform);
    if (!publisher) {
      // Unreachable while every enum member has a class; a thrown error beats a silent undefined if one is added.
      throw new Error(`No publisher registered for ${platform}`);
    }
    return publisher;
  }
}
