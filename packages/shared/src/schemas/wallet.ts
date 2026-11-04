import { z } from 'zod';
import { WalletTxnType } from '../enums';
import { dateSchema, isCalendarDate, listQuerySchema, repeatedQuery } from './common';

/**
 * `GET /hotels/:hotelId/wallet/transactions`: `type` may be repeated; `from` / `to` are Vietnam dates, each optional,
 * both inclusive.
 */
export const walletTransactionListQuerySchema = listQuerySchema
  .omit({ sort: true, search: true })
  .extend({
    type: repeatedQuery(z.enum(WalletTxnType)).optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (isCalendarDate(v.from) && isCalendarDate(v.to) && v.to < v.from) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must not be before from' });
    }
  });
export type WalletTransactionListQuery = z.infer<typeof walletTransactionListQuerySchema>;
