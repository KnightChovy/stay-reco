import { AuthService } from './auth.service';
import { AuditAction } from '../../audit/audit.service';
import { AccountStatus } from '../../../generated/prisma/client';

const email = 'audit@example.test';
const meta = { ip: '127.0.0.1', userAgent: 'Audit browser' };

function setup(overrides: Record<string, unknown> = {}) {
  const account = {
    userAccountId: 'account-id',
    email,
    status: AccountStatus.ACTIVE,
    passwordHash: 'hash',
    lockedUntil: null,
    ...overrides,
  };
  const prisma = {
    userAccount: {
      findUnique: jest.fn().mockResolvedValue(account),
      update: jest.fn().mockResolvedValue({ failedLoginCount: 1 }),
    },
  };
  const passwords = { verify: jest.fn().mockResolvedValue(true) };
  const tokens = {
    createSession: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  type Args = ConstructorParameters<typeof AuthService>;
  const service = new AuthService(
    prisma as unknown as Args[0],
    passwords as unknown as Args[1],
    tokens as unknown as Args[2],
    {} as Args[3],
    {} as Args[4],
    audit as unknown as Args[5],
    {} as Args[6],
    {} as Args[7],
  );
  return { service, prisma, passwords, tokens, audit };
}

describe('login audit reasons', () => {
  it.each([
    [AccountStatus.SUSPENDED, 'ACCOUNT_SUSPENDED', 'AUTH_ACCOUNT_SUSPENDED'],
    [
      AccountStatus.DEACTIVATED,
      'ACCOUNT_DEACTIVATED',
      'AUTH_ACCOUNT_DEACTIVATED',
    ],
    [
      AccountStatus.PENDING_VERIFICATION,
      'EMAIL_NOT_VERIFIED',
      'AUTH_EMAIL_NOT_VERIFIED',
    ],
    [AccountStatus.INVITED, 'ACCOUNT_NOT_ACTIVE', 'AUTH_INVALID_CREDENTIALS'],
    [AccountStatus.DELETED, 'ACCOUNT_NOT_ACTIVE', 'AUTH_INVALID_CREDENTIALS'],
  ])('records %s without issuing a session', async (status, reason, code) => {
    const { service, audit, tokens } = setup({ status });
    await expect(
      service.login({ email, password: 'secret' }, meta),
    ).rejects.toMatchObject({ response: { code } });
    expect(audit.log).toHaveBeenCalledWith(
      AuditAction.LOGIN_FAILED,
      'account-id',
      meta,
      expect.objectContaining({
        email,
        reason,
        code,
        userAgent: meta.userAgent,
      }),
    );
    expect(tokens.createSession).not.toHaveBeenCalled();
    expect(JSON.stringify(audit.log.mock.calls)).not.toMatch(
      /secret|passwordHash|accessToken|refreshToken/,
    );
  });

  it.each(['EMAIL_NOT_FOUND', 'INCORRECT_PASSWORD', 'PASSWORD_NOT_SET'])(
    'records %s but keeps the public error generic',
    async (reason) => {
      const { service, prisma, passwords, audit } = setup({
        passwordHash: reason === 'PASSWORD_NOT_SET' ? null : 'hash',
      });
      if (reason === 'EMAIL_NOT_FOUND')
        prisma.userAccount.findUnique.mockResolvedValue(null);
      passwords.verify.mockResolvedValue(false);
      await expect(
        service.login({ email, password: 'secret' }, meta),
      ).rejects.toMatchObject({
        response: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        AuditAction.LOGIN_FAILED,
        reason === 'EMAIL_NOT_FOUND' ? null : 'account-id',
        meta,
        expect.objectContaining({ reason, email }),
      );
      expect(JSON.stringify(audit.log.mock.calls)).not.toContain('secret');
    },
  );

  it('records an attempt during the lock with its expiry, without checking a password', async () => {
    const lockedUntil = new Date(Date.now() + 60_000);
    const { service, passwords, audit } = setup({ lockedUntil });
    await expect(
      service.login({ email, password: 'secret' }, meta),
    ).rejects.toMatchObject({ response: { code: 'AUTH_ACCOUNT_LOCKED' } });
    expect(passwords.verify).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      AuditAction.LOGIN_FAILED,
      'account-id',
      meta,
      expect.objectContaining({
        reason: 'ACCOUNT_TEMPORARILY_LOCKED',
        lockedUntil: lockedUntil.toISOString(),
      }),
    );
  });

  it('records the fifth failed attempt and the temporary lock', async () => {
    const { service, prisma, passwords, audit } = setup();
    passwords.verify.mockResolvedValue(false);
    prisma.userAccount.update.mockResolvedValue({ failedLoginCount: 5 });
    await expect(
      service.login({ email, password: 'secret' }, meta),
    ).rejects.toThrow();
    expect(audit.log).toHaveBeenCalledWith(
      AuditAction.ACCOUNT_LOCKED,
      'account-id',
      meta,
      expect.objectContaining({
        reason: 'FAILED_LOGIN_LIMIT_REACHED',
        failedLoginCount: 5,
        lockedUntil: expect.any(String) as string,
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      AuditAction.LOGIN_FAILED,
      'account-id',
      meta,
      expect.objectContaining({ reason: 'INCORRECT_PASSWORD' }),
    );
  });

  it('keeps successful sign-in working', async () => {
    const { service, audit, tokens } = setup();
    await expect(
      service.login({ email, password: 'secret' }, meta),
    ).resolves.toHaveProperty('tokens.accessToken', 'access');
    expect(tokens.createSession).toHaveBeenCalledTimes(1);
    expect(audit.log).toHaveBeenCalledWith(
      AuditAction.LOGIN_SUCCESS,
      'account-id',
      meta,
    );
  });
});
