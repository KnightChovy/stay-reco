/**
 * Turning a review's sub-ratings into its overall rating (BR-12). Kept apart from the service so the arithmetic can
 * be read and tested on its own: it decides the number shown on every hotel page.
 */

/** One criterion's score, with the weight that criterion carries. */
export interface WeightedScore {
  score: number;
  weight: number;
}

/**
 * The weighted average of the sub-ratings, on the same 1-5 scale as the scores. Dividing by the total weight rather
 * than by 1 keeps the result on that scale even if the seeded weights do not add up to exactly 1. Rounded to one
 * decimal, the precision of the `Decimal(3, 1)` column it is stored in.
 */
export function weightedAverage(scores: WeightedScore[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  // Every criterion must be scored before this is called, so an empty list means a caller skipped that check.
  if (totalWeight <= 0) {
    throw new Error('weightedAverage needs at least one criterion with weight');
  }
  const weighted = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return round1(weighted / totalWeight);
}

/** Ratings are shown with one decimal, like the Decimal(3, 1) columns they come from. */
export const round1 = (value: number) => Number(value.toFixed(1));

/**
 * Which star bucket an overall rating falls in: 4.4 counts as 4, and only 5.0 lands in the top bucket. The hotel
 * page uses it for the "5 stars: 12 reviews" bars.
 */
export const starBucket = (overallRating: number) => Math.floor(overallRating);
