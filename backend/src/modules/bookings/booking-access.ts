import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  type HotelAccess,
  partnerSuspended,
} from '../../common/hotel-access/hotel-access.service';
import type { StaffPermission } from '../../generated/prisma/client';

/** Also for bookings of another customer or hotel: their existence is not revealed. */
export const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

export const bookingStatusConflict = (message: string) =>
  new ConflictException({ code: ErrorCode.BOOKING_STATUS_CONFLICT, message });

/** A waiting refund request is for the owner to decide before the booking changes (O2, O4, O11). */
export const refundDecisionPending = () =>
  new ConflictException({
    code: ErrorCode.REFUND_DECISION_PENDING,
    message: 'A refund request waits for the hotel; decide it first',
  });

/** The audit actor of a hotel action: staff or the owning partner, the only roles the guards let through. */
export const hotelActor = (user: AuthUser) => ({
  role: user.role as 'HOTEL_STAFF' | 'HOTEL_PARTNER',
  accountId: user.accountId,
});

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
