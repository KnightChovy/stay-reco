import { z } from 'zod';
import { listQuerySchema } from './common';

/** Points a customer offers to spend on a stay; capped by the backend at the balance and at what the stay owes. */
export const pointsToUseSchema = z.number().int().min(0).max(100_000_000);

/** `GET /me/loyalty/entries`: the customer's points movements, newest first. */
export const loyaltyEntryQuerySchema = listQuerySchema.omit({
  sort: true,
  search: true,
});
export type LoyaltyEntryQuery = z.infer<typeof loyaltyEntryQuerySchema>;
