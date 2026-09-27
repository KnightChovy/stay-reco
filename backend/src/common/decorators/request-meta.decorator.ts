import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export const ReqMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestMeta => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  },
);
