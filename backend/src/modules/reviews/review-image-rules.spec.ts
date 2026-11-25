import { BadRequestException } from '@nestjs/common';
import {
  aspectRatio,
  assertImageShape,
  assertRoom,
} from './review-image-rules';

const refused = (fn: () => void) => {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    return (err as BadRequestException).getResponse() as { message: string };
  }
  throw new Error('expected the photo to be refused');
};

describe('aspectRatio', () => {
  it('reads the longer side against the shorter, whichever way up', () => {
    expect(aspectRatio(1600, 1200)).toBeCloseTo(4 / 3);
    expect(aspectRatio(1200, 1600)).toBeCloseTo(4 / 3);
    expect(aspectRatio(1000, 1000)).toBe(1);
  });
});

describe('assertImageShape', () => {
  it('accepts a square and a 4:3 photo', () => {
    expect(() => assertImageShape(1000, 1000)).not.toThrow();
    expect(() => assertImageShape(1600, 1200)).not.toThrow();
  });

  it('accepts a portrait phone photo, which Tripadvisor would refuse', () => {
    expect(() => assertImageShape(1200, 1600)).not.toThrow();
    // 3:4 is the usual phone shape.
    expect(() => assertImageShape(3024, 4032)).not.toThrow();
  });

  it('refuses a panorama either way up', () => {
    expect(refused(() => assertImageShape(3000, 1000)).message).toContain(
      'too long',
    );
    expect(() => assertImageShape(1000, 3000)).toThrow();
  });

  it('refuses a photo a hair outside 4:3 but accepts one a hair inside', () => {
    // 1.3341 rounds to 1.334, over the limit.
    expect(() => assertImageShape(1601, 1200)).toThrow();
    // 1.33306 rounds to 1.333, which is 4:3 to any viewer.
    expect(() => assertImageShape(1600, 1201)).not.toThrow();
  });

  it('refuses a photo too small to be worth showing', () => {
    expect(refused(() => assertImageShape(150, 150)).message).toContain(
      '200px',
    );
    expect(() => assertImageShape(200, 200)).not.toThrow();
  });
});

describe('assertRoom', () => {
  it('allows up to five photos and refuses the sixth', () => {
    expect(() => assertRoom(4)).not.toThrow();
    expect(refused(() => assertRoom(5)).message).toContain('5 photos');
  });
});
