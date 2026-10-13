import { createHash, randomBytes } from 'crypto';

/** Opaque token handed to the client. Only its hash is stored. */
export function generateToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
