import {
  costOf,
  MODEL_PRICES,
  type ModelPrice,
  priceOf,
  startOfMonth,
  tokensOf,
  UNKNOWN_MODEL_PRICE,
} from './model-pricing';

/** Every rate in the table, the announced future ones included. */
const everyPrice = (): ModelPrice[] =>
  Object.values(MODEL_PRICES).flatMap((s) =>
    s.then ? [s.price, s.then.price] : [s.price],
  );

const BEFORE_INCREASE = new Date('2026-12-31T23:59:59Z');
const AFTER_INCREASE = new Date('2027-01-01T00:00:00Z');

describe('priceOf', () => {
  it('knows the model the writer calls by default', () => {
    expect(priceOf('gemini-3.8-flash', BEFORE_INCREASE)).toEqual({
      input: 0.75,
      output: 3.75,
      cacheRead: 0.075,
    });
  });

  it('switches to the announced price on the day it lands', () => {
    // Without this the cap would quietly stop capping: every call recorded at half what it cost.
    expect(priceOf('gemini-3.8-flash', AFTER_INCREASE)).toEqual({
      input: 1.5,
      output: 7.5,
      cacheRead: 0.15,
    });
  });

  it('holds the old price right up to the last second', () => {
    expect(priceOf('gemini-3.8-flash', BEFORE_INCREASE).input).toBe(0.75);
  });

  it('leaves a model with no announced change alone', () => {
    expect(priceOf('gemini-3.1-flash-lite', AFTER_INCREASE)).toEqual(
      priceOf('gemini-3.1-flash-lite', BEFORE_INCREASE),
    );
  });

  it('charges an unknown model at least the dearest rate we know', () => {
    // A model we have no price for must never look cheap, or the cap stops protecting anything.
    expect(priceOf('gemini-9-whatever')).toEqual(UNKNOWN_MODEL_PRICE);
    for (const price of everyPrice()) {
      expect(UNKNOWN_MODEL_PRICE.input).toBeGreaterThanOrEqual(price.input);
      expect(UNKNOWN_MODEL_PRICE.output).toBeGreaterThanOrEqual(price.output);
      expect(UNKNOWN_MODEL_PRICE.cacheRead).toBeGreaterThanOrEqual(
        price.cacheRead,
      );
    }
  });
});

describe('costOf', () => {
  it('prices input and output at their own rates', () => {
    // 1M in at $0.75 plus 1M out at $3.75.
    const cost = costOf(
      'gemini-3.8-flash',
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      BEFORE_INCREASE,
    );
    expect(cost.toNumber()).toBe(4.5);
  });

  it('prices cached input at the cache rate', () => {
    const cost = costOf(
      'gemini-3.8-flash',
      { inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 },
      BEFORE_INCREASE,
    );
    expect(cost.toNumber()).toBe(0.075);
  });

  it('keeps six decimals, because one draft costs well under a cent', () => {
    // The figures a real call reported: 47 tokens in, 137 out.
    const cost = costOf(
      'gemini-3.8-flash',
      { inputTokens: 47, outputTokens: 137 },
      BEFORE_INCREASE,
    );
    expect(cost.toNumber()).toBeCloseTo(0.00055, 5);
    // Rounded to cents this call would have been recorded as free.
    expect(cost.toNumber()).toBeLessThan(0.01);
    expect(cost.toNumber()).toBeGreaterThan(0);
  });

  it('is zero for a call that used nothing', () => {
    expect(
      costOf('gemini-3.8-flash', {
        inputTokens: 0,
        outputTokens: 0,
      }).toNumber(),
    ).toBe(0);
  });
});

describe('tokensOf', () => {
  it('bills thinking tokens as output, because Google does', () => {
    const tokens = tokensOf({
      promptTokenCount: 1000,
      candidatesTokenCount: 200,
      thoughtsTokenCount: 500,
    });
    // Left out, a thinking model would look far cheaper than the invoice says.
    expect(tokens.outputTokens).toBe(700);
  });

  it('takes the cached tokens out of the input count', () => {
    const tokens = tokensOf({
      promptTokenCount: 1000,
      cachedContentTokenCount: 800,
      candidatesTokenCount: 100,
    });
    // promptTokenCount includes the cached part; billing both would charge those 800 twice.
    expect(tokens.inputTokens).toBe(200);
    expect(tokens.cacheReadTokens).toBe(800);
  });

  it('never reports negative input, whatever the API reports', () => {
    expect(
      tokensOf({ promptTokenCount: 100, cachedContentTokenCount: 500 })
        .inputTokens,
    ).toBe(0);
  });

  it('reads the fields a response leaves off as zero', () => {
    // What the API actually returned for a short call: no thoughts, no cache block at all.
    expect(
      tokensOf({ promptTokenCount: 47, candidatesTokenCount: 137 }),
    ).toEqual({ inputTokens: 47, outputTokens: 137, cacheReadTokens: 0 });
  });

  it('treats a missing usage block as a free call rather than crashing', () => {
    expect(tokensOf(undefined)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
    });
  });
});

describe('startOfMonth', () => {
  it('is the first instant of the month, in UTC', () => {
    expect(startOfMonth(new Date('2026-11-12T23:30:00Z')).toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
  });

  it('does not slip into the previous month near midnight', () => {
    expect(startOfMonth(new Date('2026-11-01T00:00:00Z')).toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
  });
});
