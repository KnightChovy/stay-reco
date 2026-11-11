import { z } from 'zod';
import { listQuerySchema } from './common';

/** A score given to one rating criterion, 1.0–5.0 with at most one decimal (`Decimal(3, 1)` in the database). */
export const criterionScoreSchema = z
  .number()
  .min(1)
  .max(5)
  .refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6, 'at most 1 decimal place');

/** One sub-rating of a review: which criterion, and the score for it. */
export const subRatingSchema = z.object({
  criterionId: z.uuid(),
  score: criterionScoreSchema,
});

/**
 * `POST /bookings/:id/reviews`: the customer writes the one review of a completed stay (BR-12). The overall rating is
 * the weighted average of the sub-ratings, computed by the backend, so the client never sends it. Every criterion of
 * `GET /rating-criteria` must be scored exactly once.
 */
export const createReviewSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(10).max(5000),
  subRatings: z.array(subRatingSchema).min(1).max(20),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/** `PATCH /reviews/:id`: the author edits their own review while the review window is still open. */
export const updateReviewSchema = createReviewSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  'at least one field must be given',
);
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

/** `PATCH /reviews/:id/visibility`: the hotel hides or shows a review of its own hotel. */
export const reviewVisibilitySchema = z.object({ isVisible: z.boolean() });
export type ReviewVisibilityInput = z.infer<typeof reviewVisibilitySchema>;

/**
 * `GET /hotels/:hotelId/reviews`: newest first by default. `minRating` keeps reviews at or above that overall score,
 * so a "4+ stars" filter sends `minRating=4`.
 */
export const reviewListQuerySchema = listQuerySchema.omit({ search: true }).extend({
  sort: z.enum(['newest', 'oldest', 'rating-desc', 'rating-asc']).default('newest'),
  minRating: z.coerce.number().min(1).max(5).optional(),
});
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
