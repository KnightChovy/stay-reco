import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sid: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    // Checked on every request so logout / suspension takes effect immediately.
    const session = await this.prisma.authSession.findUnique({
      where: { authSessionId: payload.sid },
      select: {
        userAccountId: true,
        revokedAt: true,
        expiresAt: true,
        userAccount: { select: { status: true, role: true } },
      },
    });
    if (
      !session ||
      session.userAccountId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.userAccount.status !== AccountStatus.ACTIVE
    ) {
      throw new UnauthorizedException();
    }

    req.user = {
      accountId: payload.sub,
      role: session.userAccount.role,
      sessionId: payload.sid,
    };
    return true;
  }
}
