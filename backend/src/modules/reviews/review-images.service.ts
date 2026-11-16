import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Review } from '@stayreco/shared';
import { lockReview } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReviewsService } from './reviews.service';
import { assertImageShape, assertRoom } from './review-image-rules';
import { reviewInclude, toReview } from './reviews.mapper';

const imageNotFound = () =>
  new NotFoundException({
    code: ErrorCode.REVIEW_IMAGE_NOT_FOUND,
    message: 'Review photo not found',
  });

/**
 * Photos attached to a review (R10). The author adds and removes them while the review window is open, so a guest
 * who forgot a photo can come back for it. A photo is stored only after it passes the shape rules, and the file is
 * deleted from Cloudinary when the row goes, so nothing is left paid for and unreferenced.
 */
@Injectable()
export class ReviewImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly reviews: ReviewsService,
  ) {}

  /** Adds one photo to the caller's own review. */
  async add(
    customerId: string,
    reviewId: string,
    file: Buffer,
  ): Promise<Review> {
    await this.reviews.assertEditable(reviewId, customerId);
    // Checked early so a full review costs no upload; checked again below, under the lock, before the row is added.
    assertRoom(await this.prisma.reviewImage.count({ where: { reviewId } }));

    // Uploaded first, because only Cloudinary knows the real dimensions; a refused shape is deleted again.
    const uploaded = await this.storage.uploadImage(file, 'reviews');
    try {
      assertImageShape(uploaded.width, uploaded.height);
      // The upload takes seconds, so two photos sent together both pass the early check. Counting again with the
      // review locked makes the second one wait for the first and see its row: the limit holds (UC32).
      await this.prisma.$transaction(async (tx) => {
        await lockReview(tx, reviewId);
        assertRoom(await tx.reviewImage.count({ where: { reviewId } }));
        const last = await tx.reviewImage.findFirst({
          where: { reviewId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        });
        await tx.reviewImage.create({
          data: {
            reviewId,
            imageUrl: uploaded.url,
            storageKey: uploaded.storageKey,
            width: uploaded.width,
            height: uploaded.height,
            sortOrder: (last?.sortOrder ?? -1) + 1,
          },
        });
      });
    } catch (err) {
      await this.storage.deleteImage(uploaded.storageKey);
      throw err;
    }
    return this.load(reviewId);
  }

  /** Removes a photo from the caller's own review, and the file behind it. */
  async remove(customerId: string, reviewImageId: string): Promise<Review> {
    const image = isUuid(reviewImageId)
      ? await this.prisma.reviewImage.findUnique({
          where: { reviewImageId },
          select: { reviewId: true, storageKey: true },
        })
      : null;
    if (!image) throw imageNotFound();
    await this.reviews.assertEditable(image.reviewId, customerId);

    // A photo under an open report is the evidence a platform manager decides on, and deleting the row would also
    // cascade the report away. Checked with the review locked, as a new report on it takes the same lock.
    await this.prisma.$transaction(async (tx) => {
      await lockReview(tx, image.reviewId);
      const open = await tx.contentReport.count({
        where: { reviewImageId, status: { in: ['OPEN', 'INVESTIGATING'] } },
      });
      if (open) {
        throw new ConflictException({
          code: ErrorCode.REVIEW_IMAGE_REPORTED,
          message: 'This photo is being looked at and cannot be removed yet',
        });
      }
      await tx.reviewImage.delete({ where: { reviewImageId } });
    });
    // Best effort: a file left behind must not fail the request.
    await this.storage.deleteImage(image.storageKey);
    return this.load(image.reviewId);
  }

  private async load(reviewId: string): Promise<Review> {
    return toReview(
      await this.prisma.review.findUniqueOrThrow({
        where: { reviewId },
        include: reviewInclude,
      }),
    );
  }
}
