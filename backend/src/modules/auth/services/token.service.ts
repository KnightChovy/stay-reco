import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, Role } from '@prisma/client';
import { RequestMeta } from '../../../common/decorators/request-meta.decorator';
import { AccessTokenPayload } from '../../../common/guards/jwt-auth.guard';
import { Env } from '../../../config/env';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditAction, AuditService } from '../../audit/audit.service';
import { generateToken, hashToken } from '../crypto.util';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires */
  expiresIn: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

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
    account: { id: string; role: Role },
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const refreshToken = generateToken();
    const session = await this.prisma.authSession.create({
      data: {
        accountId: account.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        refreshTokens: { create: { tokenHash: hashToken(refreshToken) } },
      },
    });
    return this.buildPair(account, session.id, refreshToken);
  }

  /**
   * Exchanges a refresh token for a new pair. The old token is marked used;
   * presenting a used token again means it leaked, so the whole session is revoked.
   */
  async rotate(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { session: { include: { account: true } } },
    });
    if (!record) throw new UnauthorizedException('Invalid refresh token');

    const { session } = record;
    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session expired');
    }
    if (session.account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Conditional update makes concurrent use of the same token race-safe.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      await this.revokeSession(session.id);
      await this.audit.log(
        AuditAction.REFRESH_TOKEN_REUSE,
        session.accountId,
        meta,
        { sessionId: session.id },
      );
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const next = generateToken();
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        lastUsedAt: new Date(),
        ip: meta.ip,
        userAgent: meta.userAgent,
        refreshTokens: { create: { tokenHash: hashToken(next) } },
      },
    });
    return this.buildPair(session.account, session.id, next);
  }

  async revokeSession(sessionId: string, accountId?: string): Promise<boolean> {
    const { count } = await this.prisma.authSession.updateMany({
      where: { id: sessionId, accountId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count > 0;
  }

  async revokeAllSessions(accountId: string, exceptSessionId?: string) {
    await this.prisma.authSession.updateMany({
      where: {
        accountId,
        revokedAt: null,
        ...(exceptSessionId && { id: { not: exceptSessionId } }),
      },
      data: { revokedAt: new Date() },
    });
  }

  private async buildPair(
    account: { id: string; role: Role },
    sessionId: string,
    refreshToken: string,
  ): Promise<TokenPair> {
    const payload: AccessTokenPayload = {
      sub: account.id,
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
