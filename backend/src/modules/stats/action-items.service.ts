import { Injectable } from '@nestjs/common';
import type {
  ActionItem,
  ActionItemList,
  ActionItemSeverity,
  ActionItemType,
} from '@stayreco/shared';
import { ACTION_ITEM_TYPES, SETUP_STEPS } from '@stayreco/shared';
import {
  fromCalendarDate,
  toCalendarDate,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import type { HotelAccess } from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { pendingChangeRequests } from '../bookings/booking-history';
import { fromTime, POLICY_PREFIX } from '../hotels/hotel.mapper';
import { DEFAULT_CHECK_OUT_TIME } from '../stays/offer';
import { StatsService } from './stats.service';

const DAY_MS = 86_400_000;
/** Rooms locked longer than this are flagged. */
const LOCKED_DAYS = 7;
/** Invitations not accepted after this many days are flagged. */
const INVITE_DAYS = 3;
/** Days ahead scanned for closed or nearly full dates. */
const AHEAD_DAYS = 30;
/** Forecast occupancy from which a date is "high demand". */
const HIGH_DEMAND = 90;

const SEVERITY: Record<ActionItemType, ActionItemSeverity> = {
  VERIFICATION_NEEDS_REVISION: 'CRITICAL',
  OVERDUE_CHECKOUTS: 'CRITICAL',
  REFUND_REQUESTS_PENDING: 'WARNING',
  CHANGE_REQUESTS_PENDING: 'WARNING',
  SETUP_INCOMPLETE: 'WARNING',
  ROOMS_LOCKED_LONG: 'WARNING',
  NO_AVAILABILITY_DATES: 'WARNING',
  STAFF_INVITES_PENDING: 'INFO',
  VERIFICATION_PENDING: 'INFO',
  HIGH_DEMAND_DATES: 'INFO',
};

type Item = Omit<ActionItem, 'severity'>;

/**
 * "Việc cần làm" (docs/api/partner-dashboard.md §4.1): one item per type with a count, ordered as `ACTION_ITEM_TYPES`
 * (which follows the severities). Staff only get the types of their permission groups: overdue check-outs for
 * `FRONT_DESK`, refund requests for `REFUND`, change requests for `BOOKING`.
 */
@Injectable()
export class ActionItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
  ) {}

  async list(access: HotelAccess, now = new Date()): Promise<ActionItemList> {
    const { hotelId } = access;
    const owner = access.role === 'OWNER';
    const checks: Promise<Item[]>[] = [];
    if (owner || access.permissions.includes('FRONT_DESK')) {
      checks.push(this.overdueCheckouts(hotelId, now));
    }
    if (owner || access.permissions.includes('REFUND')) {
      checks.push(this.refundRequests(hotelId));
    }
    if (owner || access.permissions.includes('BOOKING')) {
      checks.push(this.changeRequests(hotelId));
    }
    if (owner) {
      checks.push(
        this.verification(hotelId),
        this.setup(hotelId),
        this.lockedRooms(hotelId, now),
        this.pendingInvites(hotelId, now),
        this.comingDates(hotelId, now),
      );
    }
    const items = (await Promise.all(checks)).flat();
    items.sort(
      (a, b) =>
        ACTION_ITEM_TYPES.indexOf(a.type) - ACTION_ITEM_TYPES.indexOf(b.type),
    );
    return {
      generatedAt: now.toISOString(),
      items: items.map(
        (i) => ({ ...i, severity: SEVERITY[i.type] }) as ActionItem,
      ),
    };
  }

  /** The latest verification request: sent back or rejected, or still waiting for the manager. */
  private async verification(hotelId: string): Promise<Item[]> {
    const latest = await this.prisma.hotelVerificationRequest.findFirst({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
      select: { verificationRequestId: true, status: true, createdAt: true },
    });
    if (latest?.status === 'NEEDS_REVISION' || latest?.status === 'REJECTED') {
      return [
        {
          type: 'VERIFICATION_NEEDS_REVISION',
          count: 1,
          params: { requestId: latest.verificationRequestId },
        },
      ];
    }
    if (latest?.status === 'PENDING') {
      return [
        {
          type: 'VERIFICATION_PENDING',
          count: 1,
          params: { submittedAt: latest.createdAt.toISOString() },
        },
      ];
    }
    return [];
  }

  /** Refund requests waiting for the hotel; `oldestAt` is when the oldest one was made. */
  private async refundRequests(hotelId: string): Promise<Item[]> {
    const waiting = await this.prisma.booking.findMany({
      where: {
        roomType: { hotelId },
        status: 'CONFIRMED',
        invoice: { paymentStatus: 'REFUND_PENDING' },
      },
      select: { bookingId: true },
    });
    if (!waiting.length) return [];
    // A booking may have been cancelled, refused and cancelled again: its pending request is its latest one.
    const requests = await this.prisma.auditLog.groupBy({
      by: ['entityId'],
      where: {
        entityType: 'booking',
        entityId: { in: waiting.map((b) => b.bookingId) },
        action: 'BOOKING_CANCEL_REQUESTED',
      },
      _max: { createdAt: true },
    });
    const times = requests
      .map((r) => r._max.createdAt)
      .filter((at): at is Date => at !== null)
      .map((at) => at.getTime());
    if (!times.length) return [];
    return [
      {
        type: 'REFUND_REQUESTS_PENDING',
        count: waiting.length,
        params: { oldestAt: new Date(Math.min(...times)).toISOString() },
      },
    ];
  }

  /** Guests still in house after the check-out time of their check-out date (12:00 when the hotel has none, O9). */
  private async overdueCheckouts(hotelId: string, now: Date): Promise<Item[]> {
    const staying = await this.prisma.booking.findMany({
      where: {
        roomType: { hotelId },
        status: 'CHECKED_IN',
        checkOutDate: { lte: fromCalendarDate(todayInVietnam(now)) },
      },
      orderBy: [{ checkOutDate: 'asc' }, { bookingId: 'asc' }],
      select: {
        bookingId: true,
        checkOutDate: true,
        roomType: { select: { hotel: { select: { checkOutTime: true } } } },
      },
    });
    const overdue = staying.filter(
      (b) =>
        now >=
        vietnamDateTime(
          toCalendarDate(b.checkOutDate),
          fromTime(b.roomType.hotel.checkOutTime) ?? DEFAULT_CHECK_OUT_TIME,
        ),
    );
    return overdue.length
      ? [
          {
            type: 'OVERDUE_CHECKOUTS',
            count: overdue.length,
            params: { bookingIds: overdue.map((b) => b.bookingId) },
          },
        ]
      : [];
  }

  /** Change requests waiting for the hotel (O11); `oldestAt` is when the oldest one was made. */
  private async changeRequests(hotelId: string): Promise<Item[]> {
    // Oldest first.
    const waiting = await pendingChangeRequests(this.prisma, hotelId);
    return waiting.length
      ? [
          {
            type: 'CHANGE_REQUESTS_PENDING',
            count: waiting.length,
            params: { oldestAt: waiting[0].requestedAt.toISOString() },
          },
        ]
      : [];
  }

  /** A DRAFT hotel's missing onboarding steps, the same as the FE checklist. */
  private async setup(hotelId: string): Promise<Item[]> {
    const hotel = await this.prisma.hotel.findUnique({
      where: { hotelId },
      select: {
        status: true,
        hotelRoomConfig: { select: { hotelId: true } },
        _count: {
          select: {
            hotelAmenities: true,
            hotelImages: true,
            hotelProperties: {
              where: {
                verificationRequestId: null,
                propertyKey: { startsWith: POLICY_PREFIX },
              },
            },
          },
        },
      },
    });
    if (hotel?.status !== 'DRAFT') return [];
    const rooms = await this.prisma.room.count({
      where: { roomType: { hotelId } },
    });
    const done: Record<(typeof SETUP_STEPS)[number], boolean> = {
      AMENITIES: hotel._count.hotelAmenities > 0,
      POLICIES: hotel._count.hotelProperties > 0,
      IMAGES: hotel._count.hotelImages > 0,
      ROOM_CONFIG: hotel.hotelRoomConfig !== null,
      ROOMS: rooms > 0,
    };
    const missing = SETUP_STEPS.filter((step) => !done[step]);
    return missing.length
      ? [
          {
            type: 'SETUP_INCOMPLETE',
            count: missing.length,
            params: { missing },
          },
        ]
      : [];
  }

  /** Rooms in maintenance since the lock recorded in the audit log, or their last change when there is none. */
  private async lockedRooms(hotelId: string, now: Date): Promise<Item[]> {
    const cutoff = new Date(now.getTime() - LOCKED_DAYS * DAY_MS);
    const rows = await this.prisma.$queryRaw<{ room_id: string }[]>`
      SELECT r.room_id FROM room r
      JOIN room_type rt ON rt.room_type_id = r.room_type_id
      WHERE rt.hotel_id = ${hotelId}::uuid AND r.status = 'MAINTENANCE'
        AND coalesce(
          (SELECT max(a.created_at) FROM audit_log a
            WHERE a.action = 'ROOM_LOCKED' AND a.new_value LIKE '%' || r.room_id::text || '%'),
          r.updated_at
        ) < ${cutoff}
      ORDER BY r.room_number`;
    return rows.length
      ? [
          {
            type: 'ROOMS_LOCKED_LONG',
            count: rows.length,
            params: { roomIds: rows.map((r) => r.room_id), days: LOCKED_DAYS },
          },
        ]
      : [];
  }

  private async pendingInvites(hotelId: string, now: Date): Promise<Item[]> {
    const staff = await this.prisma.hotelStaff.findMany({
      where: {
        hotelId,
        userAccount: {
          status: 'INVITED',
          createdAt: { lt: new Date(now.getTime() - INVITE_DAYS * DAY_MS) },
        },
      },
      orderBy: { userAccount: { createdAt: 'asc' } },
      select: { hotelStaffId: true },
    });
    return staff.length
      ? [
          {
            type: 'STAFF_INVITES_PENDING',
            count: staff.length,
            params: { staffIds: staff.map((s) => s.hotelStaffId) },
          },
        ]
      : [];
  }

  /** The next 30 days: dates closed out by blocks, and dates nearly full (forecast §4.5). */
  private async comingDates(hotelId: string, now: Date): Promise<Item[]> {
    const days = await this.stats.forecastDays(
      hotelId,
      todayInVietnam(now),
      AHEAD_DAYS,
      now,
    );
    const items: Item[] = [];
    const closed = days.filter(
      (d) =>
        d.blocked > 0 &&
        d.roomsTotal > 0 &&
        d.booked + d.held + d.blocked >= d.roomsTotal,
    );
    if (closed.length) {
      items.push({
        type: 'NO_AVAILABILITY_DATES',
        count: closed.length,
        params: { dates: closed.map((d) => d.date) },
      });
    }
    const busy = days.filter(
      (d) => d.occupancyRate !== null && d.occupancyRate >= HIGH_DEMAND,
    );
    if (busy.length) {
      items.push({
        type: 'HIGH_DEMAND_DATES',
        count: busy.length,
        params: { firstDate: busy[0].date, threshold: HIGH_DEMAND },
      });
    }
    return items;
  }
}
