import { z } from 'zod';
import { isoDateTime, responseSchemas } from './registry';

/** Post-stay reviews (BR-12): one per completed booking, written by the customer who stayed. */

export const ratingCriterionResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    weight: z.number().describe('Share of the overall rating; the weights of all criteria add up to 1.'),
  })
  .register(responseSchemas, { id: 'RatingCriterion' });
export type RatingCriterion = z.infer<typeof ratingCriterionResponseSchema>;

export const subRatingResponseSchema = z
  .object({
    criterionId: z.uuid(),
    name: z.string(),
    score: z.number(),
  })
  .register(responseSchemas, { id: 'SubRating' });
export type SubRating = z.infer<typeof subRatingResponseSchema>;

export const reviewResponseSchema = z
  .object({
    id: z.uuid(),
    bookingId: z.uuid(),
    hotelId: z.uuid(),
    authorName: z.string().describe('The reviewer\x27s display name, shortened to first name + last initial.'),
    overallRating: z.number().describe('Weighted average of the sub-ratings, 1.0-5.0, computed by the backend.'),
    title: z.string().nullable(),
    content: z.string(),
    subRatings: z.array(subRatingResponseSchema),
    isVisible: z.boolean().describe('Hidden reviews are only returned to their author and to the hotel.'),
    stayedAt: z.string().describe('Check-out date of the reviewed stay, "YYYY-MM-DD".'),
    createdAt: isoDateTime(),
    updatedAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'Review' });
export type Review = z.infer<typeof reviewResponseSchema>;

export const ratingSummaryResponseSchema = z
  .object({
    average: z.number().describe('Average overall rating of the visible reviews; 0 when there are none.'),
    count: z.number().int(),
    distribution: z
      .array(z.object({ star: z.number().int(), count: z.number().int() }))
      .describe('How many reviews fall in each star bucket, 1 to 5 (an overall of 4.4 counts as 4).'),
    criteria: z
      .array(z.object({ criterionId: z.uuid(), name: z.string(), average: z.number() }))
      .describe('Average score per criterion across the visible reviews.'),
  })
  .register(responseSchemas, { id: 'RatingSummary' });
export type RatingSummary = z.infer<typeof ratingSummaryResponseSchema>;

/** `GET /bookings/:id/reviews/eligibility`: whether this stay can still be reviewed, for the "Write a review" button. */
export const reviewEligibilityResponseSchema = z
  .object({
    canReview: z.boolean(),
    reason: z
      .string()
      .nullable()
      .describe('Why not, as an error code (REVIEW_NOT_ALLOWED, REVIEW_ALREADY_EXISTS, REVIEW_WINDOW_CLOSED); null when it can.'),
    reviewId: z.uuid().nullable().describe('The review already written for this stay, when there is one.'),
    closesAt: isoDateTime().nullable().describe('When the review window closes; null when the stay is not completed.'),
  })
  .register(responseSchemas, { id: 'ReviewEligibility' });
export type ReviewEligibility = z.infer<typeof reviewEligibilityResponseSchema>;
