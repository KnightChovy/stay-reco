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

/** VND amount with at most 2 decimals, matching Decimal(14, 2) in the database. */
export const moneySchema = z
  .number()
  .min(0)
  .max(999_999_999_999.99)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'at most 2 decimal places');

/** Free-text reason given by a reviewer (reject, request changes, re-verification). */
export const reasonSchema = z.string().trim().min(1).max(2000);
