import { createHmac, timingSafeEqual } from 'crypto';

const signature = (code: string, secret: string) =>
  createHmac('sha256', secret).update(`voucher:${code}`).digest('base64url');

/**
 * The e-voucher QR content: `<booking code>.<HMAC-SHA256 signature>`. Nothing is stored; the hotel checks the
 * signature at check-in (phase 3) with the same secret, so a code typed by hand or edited is refused.
 */
export const signVoucher = (code: string, secret: string) =>
  `${code}.${signature(code, secret)}`;

/** The booking code of a genuine voucher token, or null. */
export function verifyVoucher(token: string, secret: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const code = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(signature(code, secret));
  return given.length === expected.length && timingSafeEqual(given, expected)
    ? code
    : null;
}
