import { signVoucher, verifyVoucher } from './voucher-token';

describe('voucher tokens', () => {
  const secret = 'voucher-test-secret-voucher-test-secret';

  it('round-trips the booking code', () => {
    const token = signVoucher('SR-261024-0842', secret);
    expect(token).toMatch(/^SR-261024-0842\.[A-Za-z0-9_-]{43}$/);
    expect(verifyVoucher(token, secret)).toBe('SR-261024-0842');
  });

  it('refuses an edited code, a wrong secret and malformed tokens', () => {
    const token = signVoucher('SR-261024-0842', secret);
    const forged = token.replace('0842', '0843');
    expect(verifyVoucher(forged, secret)).toBeNull();
    expect(verifyVoucher(token, `${secret}-other`)).toBeNull();
    expect(verifyVoucher('SR-261024-0842', secret)).toBeNull();
    expect(verifyVoucher(`${token}x`, secret)).toBeNull();
  });
});
