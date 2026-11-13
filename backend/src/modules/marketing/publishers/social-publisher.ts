import { BadGatewayException, NotImplementedException } from '@nestjs/common';
import type { SocialPlatform } from '@stayreco/shared';
import { ErrorCode } from '../../../common/errors/error-code';

/** The page a post is going to, with the token already decrypted. Never logged. */
export interface PublishTarget {
  platform: SocialPlatform;
  /** The id the platform posts under: a Page id, or an Instagram Business account id. */
  accountName: string;
  accessToken: string;
}

/** What is being posted. `mediaUrl` has to be publicly reachable: Instagram fetches it itself. */
export interface PublishablePost {
  title: string | null;
  body: string;
  mediaUrl: string | null;
}

/** How a post did, in the four numbers every platform can give in some form. */
export interface PostMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

/**
 * One platform's way of publishing a post and reading how it did.
 *
 * Kept as an interface because the three platforms differ more than they look: Facebook takes a post in one call,
 * Instagram needs a container built and then published, and TikTok will not take text at all. A caller that had to
 * know which is which would grow a branch per platform in every method.
 */
export interface SocialPublisher {
  readonly platform: SocialPlatform;
  /** Resolves to the platform's own id for the new post. */
  publish(target: PublishTarget, post: PublishablePost): Promise<string>;
  metrics(target: PublishTarget, externalPostId: string): Promise<PostMetrics>;
}

/**
 * The platform refused the post, or could not be reached.
 *
 * A 502 rather than a 500: our request was fine and the caller cannot fix it by changing anything. The platform's
 * own message is passed through, because "Error validating access token: Session has expired" is the one thing that
 * tells an owner what to do next.
 */
export const publishFailed = (platform: string, detail: string) =>
  new BadGatewayException({
    code: ErrorCode.SOCIAL_PUBLISH_FAILED,
    message: `${platform} refused the post: ${detail}`,
  });

/** Posting to this platform is not built yet. 501, because no request would succeed. */
export const platformUnsupported = (platform: string, why: string) =>
  new NotImplementedException({
    code: ErrorCode.SOCIAL_PLATFORM_UNSUPPORTED,
    message: `Posting to ${platform} is not built yet: ${why}`,
  });
