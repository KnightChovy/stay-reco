import { BadRequestException } from '@nestjs/common';
import { REVIEW_IMAGE_RULES } from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';

/**
 * What a review photo has to look like to be accepted. Kept apart from the service so the rules can be read and
 * tested without a database or an upload.
 *
 * Modelled on Tripadvisor's: a size cap, a short list of formats, and an aspect ratio that keeps a photo roughly
 * rectangular. The one deliberate difference is orientation. Tripadvisor accepts landscape only, because its layout
 * is landscape; a phone takes portrait photos by default, so refusing them would turn most guests away. The ratio is
 * therefore checked on the longer side, which still keeps out panoramas and letterbox strips.
 */

const invalid = (
  message: string,
  details?: { field: string; message: string }[],
) =>
  new BadRequestException({
    code: ErrorCode.UPLOAD_INVALID_FILE,
    message,
    ...(details && { details }),
  });

/** The ratio of the longer side to the shorter one, so a 4:3 photo and a 3:4 photo both read as 1.333. */
export const aspectRatio = (width: number, height: number) =>
  Math.max(width, height) / Math.min(width, height);

/**
 * Refuses a photo whose shape is outside the allowed range, or one too small to be worth showing. A square photo is
 * the narrowest allowed ratio (1.0) and 4:3 the widest.
 */
export function assertImageShape(width: number, height: number) {
  if (
    width < REVIEW_IMAGE_RULES.minPixels ||
    height < REVIEW_IMAGE_RULES.minPixels
  ) {
    throw invalid(
      `each side must be at least ${REVIEW_IMAGE_RULES.minPixels}px`,
      [{ field: 'file', message: `${width}x${height}` }],
    );
  }
  const ratio = aspectRatio(width, height);
  // Rounded before comparing: a 1600x1201 photo is 4:3 to any viewer, and floating point should not say otherwise.
  if (Number(ratio.toFixed(3)) > REVIEW_IMAGE_RULES.maxAspectRatio) {
    throw invalid(
      'the photo is too long: its sides must be between 1:1 and 4:3, either way up',
      [{ field: 'file', message: `${width}x${height}` }],
    );
  }
}

/** Refuses the sixth photo of a review. */
export function assertRoom(current: number) {
  if (current >= REVIEW_IMAGE_RULES.maxPerReview) {
    throw invalid(
      `at most ${REVIEW_IMAGE_RULES.maxPerReview} photos per review`,
    );
  }
}
