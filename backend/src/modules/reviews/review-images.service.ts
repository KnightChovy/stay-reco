import { Injectable, NotFoundException } from '@nestjs/common';
import type { Review } from '@stayreco/shared';
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
    assertRoom(await this.prisma.reviewImage.count({ where: { reviewId } }));

    // Uploaded first, because only Cloudinary knows the real dimensions; a refused shape is deleted again.
    const uploaded = await this.storage.uploadImage(file, 'reviews');
    try {
      assertImageShape(uploaded.width, uploaded.height);
    } catch (err) {
      await this.storage.deleteImage(uploaded.storageKey);
      throw err;
    }

    const last = await this.prisma.reviewImage.findFirst({
      where: { reviewId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    await this.prisma.reviewImage.create({
      data: {
        reviewId,
        imageUrl: uploaded.url,
        storageKey: uploaded.storageKey,
        width: uploaded.width,
        height: uploaded.height,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
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

    await this.prisma.reviewImage.delete({ where: { reviewImageId } });
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
