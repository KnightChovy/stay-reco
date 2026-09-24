import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts the route to the given roles. No decorator = any authenticated account. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
