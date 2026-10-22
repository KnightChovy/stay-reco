import { randomBytes } from 'crypto';
import { FieldCipher } from './field-cipher';

describe('FieldCipher', () => {
  const cipher = new FieldCipher(randomBytes(32).toString('base64'));

  it('round-trips and never repeats the ciphertext for the same input', () => {
    const a = cipher.encrypt('0123456789');
    const b = cipher.encrypt('0123456789');
    expect(a).not.toBe(b);
    expect(a).not.toContain('0123456789');
    expect(cipher.decrypt(a)).toBe('0123456789');
    expect(cipher.decrypt(b)).toBe('0123456789');
  });

  it('refuses values altered or encrypted with another key', () => {
    const stored = cipher.encrypt('0123456789');
    const [v, iv, tag, data] = stored.split(':');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] ^= 1;
    expect(() =>
      cipher.decrypt([v, iv, tag, flipped.toString('base64')].join(':')),
    ).toThrow('encrypted with another key or altered');

    const other = new FieldCipher(randomBytes(32).toString('base64'));
    expect(() => other.decrypt(stored)).toThrow(
      'Check that BENEFICIARY_ENCRYPTION_KEY is the key this database was seeded with',
    );
    expect(() => cipher.decrypt('plain-text')).toThrow(
      'Unknown encrypted value format',
    );
  });

  it('rejects keys that are not 32 bytes', () => {
    expect(() => new FieldCipher(randomBytes(16).toString('base64'))).toThrow();
  });
});
