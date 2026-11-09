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
    pointsBalance: z.number().int(),
    maxPointsUsable: z
      .number()
      .int()
      .describe('Never more than the balance, nor more than the stay still owes after the discount.'),
    pointsUsed: z.number().int().describe('What the asked-for points come to after capping.'),
    amount: z.number().describe('What those points take off the stay, in whole dong.'),
  })
  .register(responseSchemas, { id: 'PointsQuote' });
export type PointsQuote = z.infer<typeof pointsQuoteResponseSchema>;
