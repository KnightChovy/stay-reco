import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../../common/errors/error-code';
import {
  type HotelAccess,
  partnerSuspended,
} from '../../common/hotel-access/hotel-access.service';
import type { StaffPermission } from '../../generated/prisma/client';

/** The owner, or staff with one of `permissions`. */
function assertAnyPermission(
  access: HotelAccess,
  permissions: StaffPermission[],
) {
  const allowed =
    access.role === 'OWNER' ||
    access.permissions.some((p) => permissions.includes(p));
  if (!allowed) {
    throw new ForbiddenException({
      code: ErrorCode.FORBIDDEN,
      message: `Missing staff permission ${permissions.join(' or ')}`,
    });
  }
}

/** The hotel's bookings are for the owner and for staff with BOOKING, REFUND or FRONT_DESK (UC57, staff.md). */
export function assertCanSeeBookings(access: HotelAccess) {
  assertAnyPermission(access, ['BOOKING', 'REFUND', 'FRONT_DESK']);
}

/** Finding a guest's booking at the desk (UC37): FRONT_DESK or BOOKING. */
export function assertCanLookUp(access: HotelAccess) {
  assertAnyPermission(access, ['FRONT_DESK', 'BOOKING']);
}

/** Accepting or rejecting change requests (UC43): BOOKING, or the owner while not suspended. */
export function assertCanDecideChanges(access: HotelAccess) {
  assertAnyPermission(access, ['BOOKING']);
  if (access.partnerSuspended) throw partnerSuspended();
}

/** Check-in, check-out, no-show, cleaned rooms: FRONT_DESK, or the owner while not suspended. */
export function assertFrontDesk(access: HotelAccess) {
  assertAnyPermission(access, ['FRONT_DESK']);
  if (access.partnerSuspended) throw partnerSuspended();
}
