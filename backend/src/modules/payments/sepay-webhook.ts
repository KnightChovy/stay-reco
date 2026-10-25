import { z } from '@stayreco/shared';

/**
 * What SePay posts for each bank transaction (docs.sepay.vn, "Tích hợp WebHooks"). Unknown fields are kept out;
 * only those used here are checked.
 */
export const sepayTransactionSchema = z.object({
  /** SePay's transaction id: part of the idempotency key `sepay:<id>`. */
  id: z.coerce.number().int().positive(),
  gateway: z.string().optional(),
  /** "2026-10-25 14:02:37", Vietnam time. */
  transactionDate: z.string().optional(),
  accountNumber: z.string().nullish(),
  /** The payment code SePay recognised in the content, when configured on SePay. */
  code: z.string().nullish(),
  content: z.string().nullish(),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.coerce.number().nonnegative(),
  referenceCode: z.string().nullish(),
});
export type SepayTransaction = z.infer<typeof sepayTransactionSchema>;

/**
 * The booking code `SR-YYMMDD-XXXX` in a transfer. Banks often drop or replace the dashes ("SR2610250842",
 * "SR 261025 0842"), so they are optional; the code is rebuilt in its canonical form.
 */
export function bookingCodeOf(
  transaction: Pick<SepayTransaction, 'code' | 'content'>,
): string | null {
  for (const text of [transaction.code, transaction.content]) {
    const match = /SR[\s-]?(\d{6})[\s-]?(\d{4})(?!\d)/i.exec(text ?? '');
    if (match) return `SR-${match[1]}-${match[2]}`;
  }
  return null;
}

/** "2026-10-25 14:02:37" (Vietnam time) as an instant; `fallback` when missing or unreadable. */
export function transactionTime(value: string | undefined, fallback: Date) {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/.exec(
    value?.trim() ?? '',
  );
  if (!match) return fallback;
  const at = new Date(`${match[1]}T${match[2]}+07:00`);
  return Number.isNaN(at.getTime()) ? fallback : at;
}
