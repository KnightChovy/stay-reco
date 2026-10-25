import {
  bookingCodeOf,
  describeIssues,
  sepayTransactionSchema,
  transactionTime,
} from './sepay-webhook';

describe('bookingCodeOf', () => {
  it('reads the code with or without the dashes the bank may drop', () => {
    for (const content of [
      'SR-261025-0842',
      'SR2610250842',
      'sr 261025 0842 chuyen tien',
      'MBVCB.123.SR-261025-0842.CT tu 0123 NGUYEN VAN A',
    ]) {
      expect(bookingCodeOf({ content })).toBe('SR-261025-0842');
    }
  });

  it('prefers the code SePay recognised, then the content', () => {
    expect(
      bookingCodeOf({ code: 'SR2610250001', content: 'SR-261025-0002' }),
    ).toBe('SR-261025-0001');
    expect(bookingCodeOf({ code: null, content: 'SR-261025-0002' })).toBe(
      'SR-261025-0002',
    );
  });

  it('finds nothing in a transfer without a booking code', () => {
    expect(bookingCodeOf({ content: 'chuyen tien an trua' })).toBeNull();
    expect(bookingCodeOf({ content: 'SR-26102-0842' })).toBeNull();
    expect(bookingCodeOf({ content: 'SR-261025-08421' })).toBeNull();
    expect(bookingCodeOf({ content: null })).toBeNull();
  });
});

describe('transactionTime', () => {
  const fallback = new Date('2026-10-25T00:00:00Z');

  it('reads SePay times as Vietnam time', () => {
    expect(transactionTime('2026-10-25 14:02:37', fallback).toISOString()).toBe(
      '2026-10-25T07:02:37.000Z',
    );
  });

  it('falls back when the time is missing or unreadable', () => {
    expect(transactionTime(undefined, fallback)).toBe(fallback);
    expect(transactionTime('25/10/2026', fallback)).toBe(fallback);
  });
});

describe('sepayTransactionSchema', () => {
  it('reads the documented payload', () => {
    const parsed = sepayTransactionSchema.parse({
      id: 92704,
      gateway: 'Vietcombank',
      transactionDate: '2024-07-02 11:08:33',
      accountNumber: '1017588888',
      subAccount: '',
      code: 'SEVN63DC8E5C',
      content: 'SEVN63DC8E5C chuyen tien',
      transferType: 'in',
      description: 'NGUYEN VAN A chuyen tien',
      transferAmount: 5000000,
      accumulated: 105000000,
      referenceCode: 'FT24012345678',
    });
    expect(parsed).toEqual({
      id: '92704',
      gateway: 'Vietcombank',
      transactionDate: '2024-07-02 11:08:33',
      accountNumber: '1017588888',
      code: 'SEVN63DC8E5C',
      content: 'SEVN63DC8E5C chuyen tien',
      transferType: 'in',
      transferAmount: 5000000,
      referenceCode: 'FT24012345678',
    });
  });

  it('accepts nulls, numbers as strings, missing text fields and upper case', () => {
    const parsed = sepayTransactionSchema.parse({
      id: '92704',
      accountNumber: 1017588888,
      transferType: ' IN ',
      transferAmount: '5000000',
      gateway: null,
    });
    expect(parsed).toMatchObject({
      id: '92704',
      accountNumber: '1017588888',
      transferType: 'in',
      transferAmount: 5000000,
      gateway: null,
      content: null,
    });
  });

  it('describes what is wrong without echoing values', () => {
    const body = { id: 1, transferType: 'sideways', transferAmount: 'abc' };
    const result = sepayTransactionSchema.safeParse(body);
    expect(result.success).toBe(false);
    const problems = describeIssues(result.error!, body);
    expect(problems.some((p) => p.startsWith('transferType:'))).toBe(true);
    expect(problems.some((p) => p.includes('(got string)'))).toBe(true);
    expect(problems.join(' ')).not.toContain('sideways');
  });
});
