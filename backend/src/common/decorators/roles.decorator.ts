import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client';
import { EXT } from '../swagger/api-docs.decorators';

export const ROLES_KEY = 'roles';

/** Restricts the route to the given roles. No decorator = any authenticated account. */
export const Roles = (...roles: UserRole[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiExtension(EXT.roles, roles),
  );
