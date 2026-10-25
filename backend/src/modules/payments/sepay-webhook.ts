import { z } from '@stayreco/shared';

/** A text field SePay may send as a string, a number, an empty string or null; kept as a string or null. */
const text = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v === null || v === undefined ? null : String(v)));

/**
 * What SePay posts for each bank transaction (docs.sepay.vn, "Tích hợp WebHooks", checked 2026-10-25). Only the
 * fields used here are read, and leniently: the documentation gives strings and integers, but test notifications and
 * some banks send nulls, numbers as strings or upper-case values, and a rejected body would only be resent.
 */
export const sepayTransactionSchema = z.object({
  /** SePay's transaction id, kept when SePay resends: the idempotency key `sepay:<id>`. */
  id: z
    .union([z.number(), z.string().trim().min(1)])
    .transform((v) => String(v)),
  gateway: text,
  /** "2026-10-25 14:02:37", Vietnam time. */
  transactionDate: text,
  accountNumber: text,
  /** The payment code SePay recognised in the content; null when it matches no pattern configured on SePay. */
  code: text,
  content: text,
  /** "in" for money received, "out" for money sent. */
  transferType: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.enum(['in', 'out'])),
  transferAmount: z.coerce.number().nonnegative(),
  referenceCode: text,
});
export type SepayTransaction = z.infer<typeof sepayTransactionSchema>;

/**
 * The booking code `SR-YYMMDD-XXXX` in a transfer. Banks often drop or replace the dashes ("SR2610250842",
 * "SR 261025 0842"), so they are optional; the code is rebuilt in its canonical form.
 */
export function bookingCodeOf(
  transaction: Partial<Pick<SepayTransaction, 'code' | 'content'>>,
): string | null {
  for (const text of [transaction.code, transaction.content]) {
    const match = /SR[\s-]?(\d{6})[\s-]?(\d{4})(?!\d)/i.exec(text ?? '');
    if (match) return `SR-${match[1]}-${match[2]}`;
  }
  return null;
}

/** "2026-10-25 14:02:37" (Vietnam time) as an instant; `fallback` when missing or unreadable. */
export function transactionTime(
  value: string | null | undefined,
  fallback: Date,
) {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/.exec(
    value?.trim() ?? '',
  );
  if (!match) return fallback;
  const at = new Date(`${match[1]}T${match[2]}+07:00`);
  return Number.isNaN(at.getTime()) ? fallback : at;
}

/** Where a payload failed the schema, with the type received, for the logs; no values (they hold names, accounts). */
export function describeIssues(error: z.ZodError, body: unknown) {
  return error.issues.map((issue) => {
    const value = issue.path.reduce<unknown>(
      (v, key) =>
        v && typeof v === 'object'
          ? (v as Record<PropertyKey, unknown>)[key]
          : undefined,
      body,
    );
    const type = value === null ? 'null' : typeof value;
    return `${issue.path.join('.') || '(body)'}: ${issue.message} (got ${type})`;
  });
}
