import { z } from 'zod';
import { WalletTxnType } from '../enums';
import { isoDateTime, responseSchemas } from './registry';

/** Content of `data` returned by the hotel wallet endpoints (docs/api/partner.md, "Wallet"). */

export const walletTransactionResponseSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(WalletTxnType),
    amount: z.number().describe('Signed VND: positive credits the wallet, negative debits it.'),
    balanceAfter: z.number().describe('Available plus pending balance of the wallet right after this movement.'),
    description: z.string().nullable(),
    booking: z
      .object({ id: z.uuid(), code: z.string() })
      .nullable()
      .describe('The booking the movement belongs to; null for movements of no booking.'),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, {
    id: 'WalletTransaction',
    description: 'One movement of the hotel wallet, newest first.',
  });
export type WalletTransaction = z.infer<typeof walletTransactionResponseSchema>;

export const hotelBeneficiaryResponseSchema = z
  .object({
    account: z
      .object({
        bankName: z.string(),
        accountNumber: z.string().describe('Masked: `****1234`.'),
        accountHolder: z.string(),
      })
      .nullable()
      .describe('From the latest approved verification request; null until one is approved.'),
    verifiedAt: isoDateTime().nullable().describe('When that request was approved.'),
    updatePending: z
      .boolean()
      .describe('A newer verification request waits for review; until it is approved, payouts go to `account`.'),
  })
  .register(responseSchemas, {
    id: 'HotelBeneficiary',
    description: 'The bank account the hotel is paid out to.',
  });
export type HotelBeneficiary = z.infer<typeof hotelBeneficiaryResponseSchema>;

/** `GET /me/wallet`: what the customer holds. Only refunds fill it, and only a whole booking may be paid from it. */
export const customerWalletResponseSchema = z
  .object({
    balanceAvailable: z.number().describe('What can be spent on a booking right now.'),
    balancePending: z.number().describe('Money recorded but not yet usable; always 0 for a customer today.'),
    currency: z.string(),
    updatedAt: isoDateTime().nullable().describe('Last movement; null for a wallet that has never moved.'),
  })
  .register(responseSchemas, {
    id: 'CustomerWallet',
    description: "The signed-in customer's wallet balance.",
  });
export type CustomerWallet = z.infer<typeof customerWalletResponseSchema>;
