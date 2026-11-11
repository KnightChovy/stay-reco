import { Prisma } from '../../generated/prisma/client';

/**
 * What a model call costs, so the spend of a hotel can be capped (phase 5 Definition of Done). Kept apart from the
 * service so the arithmetic can be read and tested without calling anything.
 *
 * Prices are US dollars per million tokens, as published on 2026-11-12. They are written down rather than fetched
 * because a cap has to be computable without a network call; when Anthropic changes a price, change it here.
 */
export interface ModelPrice {
  /** Per million input tokens. */
  input: number;
  /** Per million output tokens. */
  output: number;
  /** Per million tokens read from the prompt cache. */
  cacheRead: number;
}

export const MODEL_PRICES: Record<string, ModelPrice> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.1 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

/**
 * The price of a model we have no entry for. Deliberately the most expensive one we know: an unknown model must
 * never look cheap, or a cap set in dollars would stop protecting anything.
 */
export const UNKNOWN_MODEL_PRICE: ModelPrice = {
  input: 4,
  output: 20,
  cacheRead: 0.2,
};

export const priceOf = (model: string): ModelPrice =>
  MODEL_PRICES[model] ?? UNKNOWN_MODEL_PRICE;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}

/**
 * What one call cost, in US dollars. Rounded to six decimals, the precision of the column: a single short call can
 * cost well under a cent, and rounding to cents would record every one of them as free.
 */
export function costOf(model: string, usage: TokenUsage): Prisma.Decimal {
  const price = priceOf(model);
  const dollars =
    (usage.inputTokens * price.input +
      usage.outputTokens * price.output +
      (usage.cacheReadTokens ?? 0) * price.cacheRead) /
    1_000_000;
  return new Prisma.Decimal(dollars).toDecimalPlaces(
    6,
    Prisma.Decimal.ROUND_HALF_UP,
  );
}

/** The first instant of the month a date falls in, in UTC: the window a monthly cap is measured over. */
export function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
