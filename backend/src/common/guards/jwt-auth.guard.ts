import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
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
      where: { id: payload.sid },
      select: {
        accountId: true,
        revokedAt: true,
        expiresAt: true,
        account: { select: { status: true, role: true } },
      },
    });
    if (
      !session ||
      session.accountId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.account.status !== AccountStatus.ACTIVE
    ) {
      throw new UnauthorizedException();
    }

    req.user = {
      accountId: payload.sub,
      role: session.account.role,
      sessionId: payload.sid,
    };
    return true;
  }
}
