import { z } from 'zod';
import { ReportReason, ViolationStatus } from '../enums';
import { listQuerySchema, repeatedQuery } from './common';

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

/**
 * What a review photo has to look like (R10). A size cap, a short list of formats and a ratio that keeps a photo
 * roughly rectangular, as Tripadvisor does. Unlike Tripadvisor the ratio is checked on the longer side, so a
 * portrait photo from a phone is accepted as readily as a landscape one.
 */
export const REVIEW_IMAGE_RULES = {
  maxPerReview: 5,
  maxBytes: 10 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  /** Longer side divided by shorter: 1.0 is square, 1.333 is 4:3 (or 3:4). */
  maxAspectRatio: 4 / 3,
  minPixels: 200,
} as const;

/** `POST /reviews/:id/reports`: why a review, or one of its photos, is being flagged. */
export const reportReviewSchema = z.strictObject({
  reason: z.enum(ReportReason),
  note: z.string().trim().max(1000).optional(),
  /** Flags one photo instead of the whole review. */
  reviewImageId: z.uuid().optional(),
});
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;

/** `GET /content-reports`: the platform manager's queue, oldest first so nothing waits forever. */
export const reportListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  status: repeatedQuery(z.enum(ViolationStatus)).optional(),
});
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;

/** `POST /content-reports/:id/decide`: the manager hides the content or lets it stand, and says why. */
export const decideReportSchema = z.strictObject({
  /** `RESOLVED` acts on the content; `DISMISSED` leaves it alone. `INVESTIGATING` just claims the report. */
  status: z.enum(['INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  /** Hides the review, or the one photo, when the report is resolved. */
  hide: z.boolean().optional(),
  resolution: z.string().trim().max(1000).optional(),
});
export type DecideReportInput = z.infer<typeof decideReportSchema>;
