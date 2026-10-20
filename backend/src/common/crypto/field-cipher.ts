import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

/**
 * Encrypts single text fields stored in the database (beneficiary account numbers, contract D12).
 * Output: `v1:<iv>:<auth tag>:<ciphertext>` in base64. A fresh 12-byte IV per value means equal inputs never give
 * equal outputs, and the GCM tag makes any tampering fail at decryption instead of returning garbage.
 */
export class FieldCipher {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, 'base64');
    if (this.key.length !== 32) {
      throw new Error('FieldCipher needs a 32-byte key');
    }
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [VERSION, iv, cipher.getAuthTag(), data]
      .map((part) =>
        typeof part === 'string' ? part : part.toString('base64'),
      )
      .join(':');
  }

  /** Throws when the value was not produced with this key or was altered. */
  decrypt(stored: string): string {
    const [version, iv, tag, data] = stored.split(':');
    if (version !== VERSION || !iv || !tag || !data) {
      throw new Error('Unknown encrypted value format');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
