import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts the route to the given roles. No decorator = any authenticated account. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
