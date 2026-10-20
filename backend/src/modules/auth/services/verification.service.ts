import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ErrorCode } from '../../../common/errors/error-code';
import { Env } from '../../../config/env';
import { VerificationTokenType } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  generateOtp,
  generateToken,
  hashesEqual,
  hashToken,
} from '../crypto.util';

/** Tokens sent as a link in an email (password reset, invitation). Email verification uses a 6-digit OTP instead. */
type LinkTokenType = Exclude<VerificationTokenType, 'EMAIL_VERIFY'>;

const LINK_TTL_MS: Record<LinkTokenType, number> = {
  PASSWORD_RESET: 15 * 60 * 1000,
  ACCOUNT_INVITE: 72 * 60 * 60 * 1000,
};

const invalidToken = () =>
  new BadRequestException({
    code: ErrorCode.AUTH_TOKEN_INVALID,
    message: 'Invalid or expired token',
  });

const otpExpired = () =>
  new BadRequestException({
    code: ErrorCode.AUTH_OTP_EXPIRED,
    message:
      'The code has expired or was used too many times. Request a new code.',
  });

const otpInvalid = () =>
  new BadRequestException({
    code: ErrorCode.AUTH_OTP_INVALID,
    message: 'Incorrect code',
  });

/** The OTP hash includes the row id, so two accounts that get the same 6 digits never collide on the unique column. */
const hashOtp = (tokenId: string, code: string) =>
  hashToken(`${tokenId}:${code}`);

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // ── Link tokens (password reset, invitation) ─────────────

  /** Creates a one-time link token and invalidates older unused ones of the same type. */
  async issue(accountId: string, type: LinkTokenType): Promise<string> {
    const token = generateToken();
    await this.replaceUnused(accountId, type, {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + LINK_TTL_MS[type]),
    });
    return token;
  }

  /** Marks the token used and returns its account id. Throws if invalid/expired/used. */
  async consume(token: string, type: LinkTokenType): Promise<string> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.type !== type || record.expiresAt <= new Date()) {
      throw invalidToken();
    }

    const { count } = await this.prisma.verificationToken.updateMany({
      where: { verificationTokenId: record.verificationTokenId, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) throw invalidToken();

    return record.userAccountId;
  }

  // ── Email OTP ────────────────────────────────────────────

  /** Creates a new 6-digit email code (older unused codes stop working) and returns it for mailing. */
  async issueEmailOtp(accountId: string): Promise<string> {
    const code = generateOtp();
    const tokenId = randomUUID();
    const ttlMinutes = this.config.get('EMAIL_OTP_TTL_MINUTES', {
      infer: true,
    });
    await this.replaceUnused(accountId, VerificationTokenType.EMAIL_VERIFY, {
      verificationTokenId: tokenId,
      tokenHash: hashOtp(tokenId, code),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    });
    return code;
  }

  /**
   * Checks the latest email code of the account and marks it used when correct.
   * Every attempt counts; after EMAIL_OTP_MAX_ATTEMPTS the code is discarded and a new one must be requested.
   */
  async verifyEmailOtp(accountId: string, code: string): Promise<void> {
    const maxAttempts = this.config.get('EMAIL_OTP_MAX_ATTEMPTS', {
      infer: true,
    });
    const record = await this.prisma.verificationToken.findFirst({
      where: {
        userAccountId: accountId,
        type: VerificationTokenType.EMAIL_VERIFY,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw otpExpired();

    // Claim one attempt atomically, so parallel guesses cannot exceed the limit.
    const claimed = await this.prisma.verificationToken.updateMany({
      where: {
        verificationTokenId: record.verificationTokenId,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attemptCount: { lt: maxAttempts },
      },
      data: { attemptCount: { increment: 1 } },
    });
    if (claimed.count === 0) throw otpExpired();

    if (
      hashesEqual(hashOtp(record.verificationTokenId, code), record.tokenHash)
    ) {
      const used = await this.prisma.verificationToken.updateMany({
        where: {
          verificationTokenId: record.verificationTokenId,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      if (used.count === 0) throw otpExpired();
      return;
    }

    if (record.attemptCount + 1 >= maxAttempts) {
      await this.prisma.verificationToken.updateMany({
        where: {
          verificationTokenId: record.verificationTokenId,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    }
    throw otpInvalid();
  }

  // ── Helpers ──────────────────────────────────────────────

  private async replaceUnused(
    accountId: string,
    type: VerificationTokenType,
    data: { verificationTokenId?: string; tokenHash: string; expiresAt: Date },
  ) {
    await this.prisma.$transaction([
      this.prisma.verificationToken.updateMany({
        where: { userAccountId: accountId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationToken.create({
        data: { userAccountId: accountId, type, ...data },
      }),
    ]);
  }
}
