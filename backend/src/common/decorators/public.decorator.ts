import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';
import { EXT } from '../swagger/api-docs.decorators';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skips JwtAuthGuard for this route or controller (and drops the lock in Swagger). */
export const Public = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    ApiExtension(EXT.public, true),
  );
