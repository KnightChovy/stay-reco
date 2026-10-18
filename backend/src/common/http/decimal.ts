import type { Prisma } from '../../generated/prisma/client';

/**
 * Prisma returns DECIMAL columns (money, coordinates, area) as `Decimal` objects, which JSON-serialize as strings.
 * Convert them in the response mapping so the API sends numbers (api-guide §3).
 */
export function toNumber(value: Prisma.Decimal): number;
export function toNumber(value: Prisma.Decimal | null): number | null;
export function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}
