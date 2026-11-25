import { z } from 'zod';

/** What onboarding asks for, and the least a customer must pick to finish it (docs/design/onboarding-welcome-voucher.md, W2). */
export const ONBOARDING_LIMITS = {
  /** Picks in total, over every list, to finish (and earn the welcome voucher). */
  minPicks: 3,
  /** At most this many of each list. */
  maxPerList: 20,
  /** Hotels offered to pick from. */
  hotelsOffered: 12,
} as const;

/** A short identifier from the frontend's own lists (travel styles, room amenities), as `/account/preferences` writes them. */
const listId = z.string().trim().regex(/^[a-z0-9-]{1,40}$/, 'lowercase letters, digits and hyphens');

const unique = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .max(ONBOARDING_LIMITS.maxPerList)
    .refine((v) => new Set(v).size === v.length, 'items must be different')
    .optional();

/**
 * `POST /me/onboarding`: what the customer picked on their first sign-in. Every list is optional; together they must
 * hold at least `ONBOARDING_LIMITS.minPicks` picks. A budget counts as one pick.
 *
 * Cities, hotels and views are checked against what `GET /me/onboarding` offered. Travel styles and room amenities are
 * the frontend's own lists, the same ones `/account/preferences` saves, so they are only checked for shape.
 */
export const completeOnboardingSchema = z
  .strictObject({
    cities: unique(z.string().trim().min(1).max(100)),
    hotelIds: unique(z.uuid()),
    viewIds: unique(z.uuid()),
    travelStyles: unique(listId),
    roomAmenities: unique(listId),
    /** The most the customer wants to pay a night, in whole dong. */
    budgetPerNight: z.number().int().positive().max(1_000_000_000).optional(),
  })
  .refine(
    (v) =>
      (v.cities?.length ?? 0) +
        (v.hotelIds?.length ?? 0) +
        (v.viewIds?.length ?? 0) +
        (v.travelStyles?.length ?? 0) +
        (v.roomAmenities?.length ?? 0) +
        (v.budgetPerNight === undefined ? 0 : 1) >=
      ONBOARDING_LIMITS.minPicks,
    `pick at least ${ONBOARDING_LIMITS.minPicks}`,
  );
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
