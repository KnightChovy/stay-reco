import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

/** Opaque token handed to the client. Only its hash is stored. */
export function generateToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 6-digit numeric code, e.g. "042917". */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Constant-time comparison of two hex digests, so timing does not reveal how many characters matched. */
export function hashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
