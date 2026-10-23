import { z } from 'zod';

/**
 * Query parameters shared by every list endpoint (api-guide §5): 1-based `page`, `pageSize` (default 10, max 100),
 * one named `sort` option and a free-text `search`. Endpoints extend it with their own filters.
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

/** For `Decimal(x, 2)` columns: without it, extra decimals are rounded by the database without telling the client. */
export const hasAtMost2Decimals = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

/** VND amount with at most 2 decimals, matching Decimal(14, 2) in the database. */
export const moneySchema = z
  .number()
  .min(0)
  .max(999_999_999_999.99)
  .refine(hasAtMost2Decimals, 'at most 2 decimal places');

/** Free-text reason given by a reviewer (reject, request changes, re-verification). */
export const reasonSchema = z.string().trim().min(1).max(2000);

/** At most 20 characters in total, the size of the phone columns. */
export const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[\d\s-]{8,20}$/, 'phone must be a valid phone number');

/** "HH:mm", e.g. "14:00". */
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:mm');

/** A calendar date without time, "YYYY-MM-DD" (check-in, check-out, rule ranges). */
export const dateSchema = z.iso.date();

/**
 * True for a real calendar date in "YYYY-MM-DD". Cross-field checks use it to skip dates that already failed
 * `dateSchema` ("2026-02-30" would otherwise roll over to March 2 and add a second, misleading error).
 */
export const isCalendarDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(v);
};

/** Whole days from `from` to `to` (both "YYYY-MM-DD"); 1 for consecutive days. */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * A query parameter that may be repeated (`?status=a&status=b`, api-guide §5): one value arrives as a string,
 * several as an array. Always parsed as an array.
 */
export const repeatedQuery = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v === undefined || Array.isArray(v) ? v : [v]), z.array(item));
