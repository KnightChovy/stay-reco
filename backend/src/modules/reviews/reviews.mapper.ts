import type { Review, SubRating } from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import type { Prisma } from '../../generated/prisma/client';

/** A review with everything the response needs: its sub-ratings, the stay it belongs to and the author's name. */
export type ReviewRow = Prisma.ReviewGetPayload<{
  include: {
    userItemRatings: { include: { ratingCriterion: true } };
    booking: { select: { checkOutDate: true } };
    customer: { select: { userAccount: { select: { fullName: true } } } };
  };
}>;

/**
 * Reviews are public, so the full name is not: "Nguyễn Văn An" is shown as "Nguyễn Văn A.", the way Booking.com and
 * Traveloka do it. A single-word name is left as it is.
 */
export function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName.trim();
  const last = parts[parts.length - 1];
  return [...parts.slice(0, -1), `${last.charAt(0)}.`].join(' ');
}

const toSubRating = (
  r: ReviewRow['userItemRatings'][number],
): SubRating => ({
  criterionId: r.ratingCriterionId,
  name: r.ratingCriterion.name,
  score: toNumber(r.score),
});

export const toReview = (review: ReviewRow): Review => ({
  id: review.reviewId,
  bookingId: review.bookingId,
  hotelId: review.hotelId,
  authorName: displayName(review.customer.userAccount.fullName),
  overallRating: toNumber(review.overallRating),
  title: review.title,
  content: review.content,
  // Ordered by criterion name so every review shows its scores in the same order.
  subRatings: review.userItemRatings
    .map(toSubRating)
    .sort((a, b) => a.name.localeCompare(b.name)),
  isVisible: review.isVisible,
  stayedAt: review.booking.checkOutDate.toISOString().slice(0, 10),
  createdAt: review.createdAt.toISOString(),
  updatedAt: review.updatedAt.toISOString(),
});

/** Everything `toReview` needs, so the service and its queries cannot drift apart. */
export const reviewInclude = {
  userItemRatings: { include: { ratingCriterion: true } },
  booking: { select: { checkOutDate: true } },
  customer: { select: { userAccount: { select: { fullName: true } } } },
} satisfies Prisma.ReviewInclude;
