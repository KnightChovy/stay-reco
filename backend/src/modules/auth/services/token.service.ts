import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RequestMeta } from '../../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../../common/errors/error-code';
import { AccessTokenPayload } from '../../../common/guards/jwt-auth.guard';
import { Env } from '../../../config/env';
import { AccountStatus, UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditAction, AuditService } from '../../audit/audit.service';
import { generateToken, hashToken } from '../crypto.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires */
  expiresIn: number;
}

type TokenSubject = { userAccountId: string; role: UserRole };

const DAY_MS = 24 * 60 * 60 * 1000;

const refreshFailed = (message: string) =>
  new UnauthorizedException({
    code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    message,
  });

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
  ) {}

  get refreshTtlMs(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * DAY_MS;
  }

  /** Starts a new session (one per login/device). */
  async createSession(
    account: TokenSubject,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const refreshToken = generateToken();
    const session = await this.prisma.authSession.create({
      data: {
        userAccountId: account.userAccountId,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        refreshTokens: { create: { tokenHash: hashToken(refreshToken) } },
      },
    });
    return this.buildPair(account, session.authSessionId, refreshToken);
  }

  /**
   * Exchanges a refresh token for a new pair. The old token is marked used;
   * presenting a used token again means it leaked, so the whole session is revoked.
   */
  async rotate(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { authSession: { include: { userAccount: true } } },
    });
    if (!record) throw refreshFailed('Invalid refresh token');

    const session = record.authSession;
    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw refreshFailed('Session expired');
    }
    if (session.userAccount.status !== AccountStatus.ACTIVE) {
      throw refreshFailed('Invalid refresh token');
    }

    // Conditional update makes concurrent use of the same token race-safe.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { refreshTokenId: record.refreshTokenId, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      await this.revokeSession(session.authSessionId);
      await this.audit.log(
        AuditAction.REFRESH_TOKEN_REUSE,
        session.userAccountId,
        meta,
        { sessionId: session.authSessionId },
      );
      throw refreshFailed('Refresh token reuse detected');
    }

    const next = generateToken();
    await this.prisma.authSession.update({
      where: { authSessionId: session.authSessionId },
      data: {
        lastUsedAt: new Date(),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        refreshTokens: { create: { tokenHash: hashToken(next) } },
      },
    });
    return this.buildPair(session.userAccount, session.authSessionId, next);
  }

  async revokeSession(sessionId: string, accountId?: string): Promise<boolean> {
    const { count } = await this.prisma.authSession.updateMany({
      where: {
        authSessionId: sessionId,
        userAccountId: accountId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return count > 0;
  }

  async revokeAllSessions(accountId: string, exceptSessionId?: string) {
    await this.prisma.authSession.updateMany({
      where: {
        userAccountId: accountId,
        revokedAt: null,
        ...(exceptSessionId && { authSessionId: { not: exceptSessionId } }),
      },
      data: { revokedAt: new Date() },
    });
  }

  private async buildPair(
    account: TokenSubject,
    sessionId: string,
    refreshToken: string,
  ): Promise<TokenPair> {
    const payload: AccessTokenPayload = {
      sub: account.userAccountId,
      role: account.role,
      sid: sessionId,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      refreshToken,
      expiresIn: this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
    };
  }
}
