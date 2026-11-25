import { round1, starBucket, weightedAverage } from './rating';

describe('weightedAverage', () => {
  // The seeded criteria: cleanliness .25, location .2, service .25, quietness .15, value .15.
  const seeded = (...scores: number[]) =>
    weightedAverage(
      [0.25, 0.2, 0.25, 0.15, 0.15].map((weight, i) => ({
        score: scores[i],
        weight,
      })),
    );

  it('gives the same score back when every criterion agrees', () => {
    expect(seeded(5, 5, 5, 5, 5)).toBe(5);
    expect(seeded(1, 1, 1, 1, 1)).toBe(1);
  });

  it('weighs the heavier criteria more', () => {
    // Cleanliness and service carry .25 each, so a 5 on both outweighs a 1 on the three lighter ones.
    expect(seeded(5, 1, 5, 1, 1)).toBe(3);
  });

  it('stays on the 1-5 scale when the weights do not add up to 1', () => {
    expect(weightedAverage([{ score: 4, weight: 2 }])).toBe(4);
    expect(
      weightedAverage([
        { score: 5, weight: 3 },
        { score: 1, weight: 1 },
      ]),
    ).toBe(4);
  });

  it('rounds to one decimal, the precision of the column', () => {
    expect(
      weightedAverage([
        { score: 4, weight: 1 },
        { score: 5, weight: 2 },
      ]),
    ).toBe(4.7);
  });

  it('refuses a list with no weight rather than dividing by zero', () => {
    expect(() => weightedAverage([])).toThrow();
    expect(() => weightedAverage([{ score: 5, weight: 0 }])).toThrow();
  });
});

describe('round1', () => {
  it('rounds half up, like the money rules', () => {
    expect(round1(4.45)).toBe(4.5);
    expect(round1(4.44)).toBe(4.4);
  });
});

describe('starBucket', () => {
  it('counts 4.4 as 4 and leaves 5.0 alone in the top bucket', () => {
    expect(starBucket(4.4)).toBe(4);
    expect(starBucket(4.9)).toBe(4);
    expect(starBucket(5)).toBe(5);
    expect(starBucket(1)).toBe(1);
  });
});
