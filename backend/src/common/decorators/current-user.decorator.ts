import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../generated/prisma/client';

export interface AuthUser {
  accountId: string;
  role: UserRole;
  sessionId: string;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
