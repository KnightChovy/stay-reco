import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skips JwtAuthGuard for this route or controller. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
