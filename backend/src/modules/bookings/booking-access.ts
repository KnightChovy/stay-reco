import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../../common/errors/error-code';
import type { HotelAccess } from '../../common/hotel-access/hotel-access.service';

/** The hotel's bookings are for the owner and for staff with BOOKING or REFUND (UC57, staff.md). */
export function assertCanSeeBookings(access: HotelAccess) {
  const allowed =
    access.role === 'OWNER' ||
    access.permissions.some((p) => p === 'BOOKING' || p === 'REFUND');
  if (!allowed) {
    throw new ForbiddenException({
      code: ErrorCode.FORBIDDEN,
      message: 'Missing staff permission BOOKING or REFUND',
    });
  }
}
