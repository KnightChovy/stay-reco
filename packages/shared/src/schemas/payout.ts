import { z } from 'zod';
import { listQuerySchema, repeatedQuery } from './common';

/** The state of a withdrawal, from its latest audit event (decision M1). */
export const PAYOUT_STATUSES = ['PENDING', 'PAID', 'REJECTED', 'CANCELLED'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/** Working days a platform manager has to process a withdrawal (BR-22). */
export const PAYOUT_PROCESSING_DAYS = 2;

/** `POST /hotels/:hotelId/payouts`: whole dong, more than 0; the available balance is checked by the backend (MSG30). */
export const createPayoutSchema = z.strictObject({
  amount: z.number().int('amount must be whole dong').positive().max(999_999_999_999),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

/** `GET /hotels/:hotelId/payouts`: newest first; `status` may be repeated. */
export const payoutListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  status: repeatedQuery(z.enum(PAYOUT_STATUSES)).optional(),
});
export type PayoutListQuery = z.infer<typeof payoutListQuerySchema>;

/**
 * `GET /payouts` (platform manager): `PENDING` by default, oldest first so the 2 working days are met; any other
 * selection newest first. `search` matches the hotel or the partner name.
 */
export const managerPayoutListQuerySchema = listQuerySchema.omit({ sort: true }).extend({
  status: repeatedQuery(z.enum(PAYOUT_STATUSES)).optional(),
  hotelId: z.uuid().optional(),
});
export type ManagerPayoutListQuery = z.infer<typeof managerPayoutListQuerySchema>;

/** `POST /payouts/:id/paid`: the reference of the bank transfer the manager made. */
export const payoutPaidSchema = z.strictObject({
  bankReference: z.string().trim().min(1).max(50),
});
export type PayoutPaidInput = z.infer<typeof payoutPaidSchema>;

/** `POST /payouts/:id/reject`: sent to the partner. */
export const payoutRejectSchema = z.strictObject({
  reason: z.string().trim().min(1).max(500),
});
export type PayoutRejectInput = z.infer<typeof payoutRejectSchema>;
