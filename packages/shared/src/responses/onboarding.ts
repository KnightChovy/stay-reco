import { z } from 'zod';
import { amenityResponseSchema } from './hotel';
import { voucherResponseSchema } from './promotion';
import { responseSchemas } from './registry';

export const ONBOARDING_STATUSES = ['NEW', 'SKIPPED', 'COMPLETED'] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

/** A city that has bookable hotels, with one of their photos to show on its card. */
export const onboardingDestinationSchema = z
  .object({
    city: z.string(),
    hotels: z.number().int().describe('How many bookable hotels the city has.'),
    imageUrl: z.string().nullable().describe('The cover photo of one of them; null when none has a photo.'),
  })
  .register(responseSchemas, { id: 'OnboardingDestination' });

/** A hotel offered to pick from: the card, nothing more. */
export const onboardingHotelSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    city: z.string(),
    starRating: z.number().int().nullable(),
    imageUrl: z.string().nullable(),
    rating: z.number().nullable().describe('Average of its visible reviews, 1 decimal; null with none.'),
    reviewCount: z.number().int(),
  })
  .register(responseSchemas, { id: 'OnboardingHotel' });

/**
 * A hotel offered on the hotel step after the customer said where and how they travel (`GET /me/onboarding/hotels`):
 * the card, why it was offered, and its cheapest night.
 */
export const onboardingHotelSuggestionSchema = onboardingHotelSchema
  .extend({
    matches: z
      .array(z.string())
      .describe('What of the answers it fits, in words for the card: "Nghỉ dưỡng & thư giãn", "Hồ bơi", a view name.'),
    pricePerNightFrom: z.number().nullable().describe('Base price of its cheapest sellable room type; null with none.'),
    overBudget: z
      .boolean()
      .describe('Its cheapest night is more than 20% over the budget given; such hotels come last.'),
  })
  .register(responseSchemas, { id: 'OnboardingHotelSuggestion' });
export type OnboardingHotelSuggestion = z.infer<typeof onboardingHotelSuggestionSchema>;
/** `GET /me/onboarding/hotels`: best fit first, at most `ONBOARDING_LIMITS.hotelsOffered`. */
export const onboardingHotelSuggestionsResponseSchema = z.array(onboardingHotelSuggestionSchema);

/** `GET /me/onboarding` and the answer of `POST /me/onboarding` and `/skip`. */
export const onboardingResponseSchema = z
  .object({
    status: z
      .enum(ONBOARDING_STATUSES)
      .describe('`NEW`: show the screen. `SKIPPED`: offer it again from the account page. `COMPLETED`: done.'),
    options: z
      .object({
        destinations: z.array(onboardingDestinationSchema),
        hotels: z.array(onboardingHotelSchema),
        views: z.array(amenityResponseSchema).describe('The catalog amenities of the "Tầm nhìn" category.'),
      })
      .nullable()
      .describe('What to pick from; null once onboarding is completed.'),
    voucher: voucherResponseSchema
      .nullable()
      .describe('The welcome code once it has been issued, as in `GET /me/vouchers`; otherwise null.'),
  })
  .register(responseSchemas, { id: 'Onboarding' });
export type Onboarding = z.infer<typeof onboardingResponseSchema>;
export type OnboardingDestination = z.infer<typeof onboardingDestinationSchema>;
export type OnboardingHotel = z.infer<typeof onboardingHotelSchema>;
