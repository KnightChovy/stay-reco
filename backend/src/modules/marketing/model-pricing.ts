import { Prisma } from '../../generated/prisma/client';

/**
 * What a model call costs, so the spend of a hotel can be capped (phase 5 Definition of Done). Kept apart from the
 * service so the arithmetic can be read and tested without calling anything.
 *
 * Prices are US dollars per million tokens, from the Gemini API price list as published on 2026-11-12. They are
 * written down rather than fetched because a cap has to be computable without a network call; when Google changes a
 * price, change it here.
 *
 * A key from AI Studio also has a free tier, which these prices ignore: a free call is recorded at its paid rate.
 * That is the safe direction to be wrong in - the cap stays a cap when the hotel moves onto a paid key, and nobody
 * is ever let through because the call happened to be free.
 */
export interface ModelPrice {
  /** Per million input tokens. */
  input: number;
  /** Per million output tokens, thinking tokens included: Google bills them at the output rate. */
  output: number;
  /** Per million input tokens that were served from the context cache. */
  cacheRead: number;
}

/**
 * A model's price, and the dated change to it that Google has already announced.
 *
 * The announced change is written down rather than waited for because the alternative is a silent error: on the day
 * it lands, every call would be recorded at half of what it actually cost, and the cap would quietly stop capping.
 * A price with a date in it is checked by a test; a comment saying "update this in January" is not.
 */
interface PriceSchedule {
  price: ModelPrice;
  /** Replaces `price` for calls made from this instant on. */
  then?: { from: string; price: ModelPrice };
}

/**
 * Flash prices double on 2027-01-01, as announced on the price list. Both halves are here so the switch needs no
 * deploy.
 */
const FLASH_3_8: PriceSchedule = {
  price: { input: 0.75, output: 3.75, cacheRead: 0.075 },
  then: {
    from: '2027-01-01T00:00:00Z',
    price: { input: 1.5, output: 7.5, cacheRead: 0.15 },
  },
};

export const MODEL_PRICES: Record<string, PriceSchedule> = {
  'gemini-3.8-flash': FLASH_3_8,
  'gemini-3.6-flash': FLASH_3_8,
  'gemini-3.5-flash-lite': {
    price: { input: 0.3, output: 2.5, cacheRead: 0.03 },
  },
  'gemini-3.1-flash-lite': {
    price: { input: 0.25, output: 1.5, cacheRead: 0.025 },
  },
};

/**
 * The price of a model we have no entry for. Deliberately at least as expensive as the dearest rate we know, the
 * post-increase Flash rate included: an unknown model must never look cheap, or a cap set in dollars would stop
 * protecting anything.
 */
export const UNKNOWN_MODEL_PRICE: ModelPrice = {
  input: 1.5,
  output: 7.5,
  cacheRead: 0.15,
};

/** What `model` costs for a call made at `on`. */
export function priceOf(model: string, on: Date = new Date()): ModelPrice {
  const schedule = MODEL_PRICES[model];
  if (!schedule) return UNKNOWN_MODEL_PRICE;
  const { then } = schedule;
  if (then && on.getTime() >= new Date(then.from).getTime()) return then.price;
  return schedule.price;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}

/**
 * What one call cost, in US dollars. Rounded to six decimals, the precision of the column: a single short call can
 * cost well under a cent, and rounding to cents would record every one of them as free.
 */
export function costOf(
  model: string,
  usage: TokenUsage,
  on: Date = new Date(),
): Prisma.Decimal {
  const price = priceOf(model, on);
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

/** What the Gemini API reports about a call, as much of it as the cost depends on. */
export interface GeminiUsageMetadata {
  promptTokenCount?: number | null;
  candidatesTokenCount?: number | null;
  cachedContentTokenCount?: number | null;
  thoughtsTokenCount?: number | null;
}

/**
 * The Gemini usage figures, turned into the three numbers the `ai_usage` row and `costOf` want.
 *
 * Two details decide whether the bill adds up, and neither is obvious from the field names:
 *
 * - `promptTokenCount` is the whole prompt, the part served from cache included. Billing the two separately means
 *   subtracting the cached tokens out, or every cached call is counted at full price and then again at the cache
 *   rate.
 * - `thoughtsTokenCount` is not in `candidatesTokenCount`, and Google bills thinking at the output rate. Left out,
 *   a thinking model looks far cheaper than the invoice says.
 *
 * Fields the API leaves off a given response are read as zero, which is why this takes the whole block rather than
 * the three numbers: a response with no `usageMetadata` at all is a recorded free call, not a crash.
 */
export function tokensOf(usage: GeminiUsageMetadata | undefined): TokenUsage {
  const prompt = usage?.promptTokenCount ?? 0;
  const cached = usage?.cachedContentTokenCount ?? 0;
  return {
    inputTokens: Math.max(prompt - cached, 0),
    outputTokens:
      (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
    cacheReadTokens: cached,
  };
}

/** The first instant of the month a date falls in, in UTC: the window a monthly cap is measured over. */
export function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
