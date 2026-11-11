import {
  costOf,
  MODEL_PRICES,
  priceOf,
  startOfMonth,
  UNKNOWN_MODEL_PRICE,
} from './model-pricing';

describe('priceOf', () => {
  it('knows the models the backend calls', () => {
    expect(priceOf('claude-opus-5-5')).toEqual(MODEL_PRICES['claude-opus-5-5']);
  });

  it('charges an unknown model the most expensive rate, so a cap keeps protecting', () => {
    expect(priceOf('something-new')).toEqual(UNKNOWN_MODEL_PRICE);
  });
});

describe('costOf', () => {
  it('prices input and output at their own rates', () => {
    // 1M input at $4 plus 1M output at $20.
    const cost = costOf('claude-opus-5-5', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    expect(cost.toNumber()).toBe(24);
  });

  it('prices a realistic marketing post in fractions of a cent', () => {
    const cost = costOf('claude-opus-5-5', {
      inputTokens: 1200,
      outputTokens: 400,
    });
    // 1200 x $4/M + 400 x $20/M = $0.0048 + $0.008
    expect(cost.toNumber()).toBeCloseTo(0.0128, 6);
  });

  it('charges cached input at the cache rate', () => {
    const cost = costOf('claude-opus-5-5', {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000,
    });
    expect(cost.toNumber()).toBe(0.2);
  });

  it('keeps six decimals, so a sub-cent call is not recorded as free', () => {
    const cost = costOf('claude-haiku-5-5', {
      inputTokens: 100,
      outputTokens: 50,
    });
    // 100 x $0.1/M + 50 x $0.5/M = $0.000035
    expect(cost.toNumber()).toBe(0.000035);
    expect(cost.toNumber()).toBeGreaterThan(0);
  });

  it('costs nothing when nothing was used', () => {
    expect(
      costOf('claude-opus-5-5', { inputTokens: 0, outputTokens: 0 }).toNumber(),
    ).toBe(0);
  });
});

describe('startOfMonth', () => {
  it('goes back to the first instant of the month', () => {
    expect(
      startOfMonth(new Date('2026-11-12T23:59:59.999Z')).toISOString(),
    ).toBe('2026-11-01T00:00:00.000Z');
  });

  it('is already the answer on the first of the month', () => {
    expect(
      startOfMonth(new Date('2026-11-01T00:00:00.000Z')).toISOString(),
    ).toBe('2026-11-01T00:00:00.000Z');
  });
});
