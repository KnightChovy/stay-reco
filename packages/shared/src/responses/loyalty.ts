import { z } from 'zod';
import { LoyaltyTier } from '../enums';
import { isoDateTime, responseSchemas } from './registry';

/** Loyalty points (BR-11): earned on what a stay was paid, spent as the third subtraction of a later one. */

export const loyaltyAccountResponseSchema = z
  .object({
    programId: z.uuid(),
    programName: z.string(),
    pointsBalance: z.number().int().describe('Points available to spend right now.'),
    lifetimePoints: z.number().int().describe('Every point ever earned; spending never lowers it.'),
    tier: z.enum(LoyaltyTier),
    nextTier: z
      .object({ tier: z.enum(LoyaltyTier), pointsNeeded: z.number().int() })
      .nullable()
      .describe('What is left to reach the next tier; null once the top one is reached.'),
    pointValue: z.number().describe('What one point is worth in dong when it is spent.'),
    balanceValue: z.number().describe('pointsBalance x pointValue, in dong: what the balance is worth today.'),
    joinedAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'LoyaltyAccount' });
export type LoyaltyAccount = z.infer<typeof loyaltyAccountResponseSchema>;

/** One movement of points, read back from the audit log rather than a table of its own. */
export const loyaltyEntryResponseSchema = z
  .object({
    at: isoDateTime(),
    kind: z.enum(['EARNED', 'SPENT', 'REFUNDED']),
    points: z.number().int().describe('Positive when earned or given back, negative when spent.'),
    bookingId: z.uuid().nullable(),
    hotelName: z.string().nullable(),
  })
  .register(responseSchemas, { id: 'LoyaltyEntry' });
export type LoyaltyEntry = z.infer<typeof loyaltyEntryResponseSchema>;

/** The points part of a stay quote: how many may be spent, and what they would take off. */
export const pointsQuoteResponseSchema = z
  .object({
    programId: z.uuid(),
    pointsBalance: z.number().int(),
    maxPointsUsable: z
      .number()
      .int()
      .describe(
        'Never more than the balance, nor more than the share of the stay after the discount the hotel allows.',
      ),
    pointsUsed: z.number().int().describe('What the asked-for points come to after capping.'),
    amount: z.number().describe('What those points take off the stay, in whole dong.'),
    acceptsPoints: z.boolean().describe('False when the hotel does not take points: maxPointsUsable is then 0.'),
    maxRedeemPercent: z
      .number()
      .describe('The share of the stay after the discount that points may pay at this hotel.'),
  })
  .register(responseSchemas, { id: 'PointsQuote' });
export type PointsQuote = z.infer<typeof pointsQuoteResponseSchema>;

/** `GET` / `PUT /hotels/:hotelId/loyalty-program`: a hotel's own rules on top of the platform programme (L8–L11). */
export const hotelLoyaltyProgramResponseSchema = z
  .object({
    custom: z.boolean().describe('True once the hotel has saved its own rules, switched on or not.'),
    appliesNow: z.boolean().describe('True when the hotel rules are switched on and the platform programme runs.'),
    isActive: z.boolean(),
    pointsPerCurrency: z.number().describe('Points earned per dong paid at this hotel; the platform rate until saved.'),
    earnMultiplier: z.number().describe('pointsPerCurrency / the platform rate, rounded to 2 decimals.'),
    acceptsPoints: z.boolean(),
    maxRedeemPercent: z.number(),
    platform: z
      .object({
        name: z.string(),
        isActive: z.boolean(),
        pointsPerCurrency: z.number(),
        pointValue: z.number().describe('What one point is worth in dong; the same at every hotel.'),
      })
      .describe('The platform programme the hotel rules sit on.'),
    limits: z.object({
      minPointsPerCurrency: z.number().describe('The platform rate: a hotel never earns less.'),
      maxPointsPerCurrency: z.number().describe('Three times the platform rate.'),
      minRedeemPercent: z.number(),
      maxRedeemPercent: z.number(),
    }),
  })
  .register(responseSchemas, { id: 'HotelLoyaltyProgram' });
export type HotelLoyaltyProgram = z.infer<typeof hotelLoyaltyProgramResponseSchema>;
