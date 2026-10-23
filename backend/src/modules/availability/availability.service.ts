import { ConflictException, Injectable } from '@nestjs/common';
import type {
  AvailabilityDay,
  AvailabilityQuery,
  UpdateAvailabilityInput,
} from '@stayreco/shared';
import { daysBetween } from '@stayreco/shared';
import { lockRoomType } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  addDays,
  fromCalendarDate,
  toCalendarDate,
} from '../../common/http/calendar-date';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { roomTypeNotFound } from '../rooms/room-types.service';

type Db = Prisma.TransactionClient | PrismaService;

/** What one room type has on one date, with the room ids an update needs. */
interface DayState {
  day: AvailabilityDay;
  /** Rooms that could be on sale with every closure lifted. */
  maxOnSale: number;
  /** Sellable rooms with no calendar row (or an `AVAILABLE` one) that day: the rooms that can be closed. */
  openRooms: string[];
  /** `BLOCKED` rows on sellable rooms: the closures that can be lifted. */
  closedRows: string[];
}

/**
 * Rooms on sale per room type and day (UC63, money-rules §3), counted from `room_calendars`: `BOOKED` and `HELD`
 * rows are nights sold or held for a booking, `BLOCKED` rows are rooms the partner took off sale, and a room with no
 * row is free. Rooms locked for maintenance are not sellable; `OCCUPIED` and `CLEANING` describe today only.
 */
@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** `hotelId` was checked by `HotelAccessRequired`. Room types in creation order, then by date. */
  async list(
    hotelId: string,
    query: AvailabilityQuery,
  ): Promise<AvailabilityDay[]> {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId, roomTypeId: query.roomTypeId },
      orderBy: { createdAt: 'asc' },
      select: { roomTypeId: true },
    });
    const states = await this.days(
      this.prisma,
      roomTypes.map((rt) => rt.roomTypeId),
      query.from,
      query.to,
    );
    return states.map((s) => s.day);
  }

  /**
   * Closes or reopens rooms so that `onSale` rooms stay sellable on every day of the range. Booked and held nights
   * are never touched, so asking for more rooms than are left on some day is refused for the whole range.
   */
  async update(
    hotelId: string,
    input: UpdateAvailabilityInput,
  ): Promise<AvailabilityDay[]> {
    const { roomTypeId, from, to, onSale } = input;
    const found = await this.prisma.roomType.count({
      where: { roomTypeId, hotelId },
    });
    if (!found) throw roomTypeNotFound();

    return this.prisma.$transaction(async (tx) => {
      // Holds take the same lock, so no booking slips in between the count and the change.
      await lockRoomType(tx, roomTypeId);
      const states = await this.days(tx, [roomTypeId], from, to);

      const short = states.filter((s) => s.maxOnSale < onSale);
      if (short.length) {
        throw new ConflictException({
          code: ErrorCode.AVAILABILITY_BELOW_BOOKED,
          message: 'Not enough free rooms on some days',
          details: short.map((s) => ({
            field: 'onSale',
            message: `${s.day.date}: at most ${s.maxOnSale} rooms can be on sale`,
          })),
        });
      }

      const close: Prisma.RoomCalendarsCreateManyInput[] = [];
      const reopen: string[] = [];
      for (const { day, maxOnSale, openRooms, closedRows } of states) {
        // Closures needed so that exactly `onSale` of the sellable rooms stay open.
        const change = maxOnSale - onSale - closedRows.length;
        if (change > 0) {
          for (const roomId of openRooms.slice(0, change)) {
            close.push({
              roomId,
              date: fromCalendarDate(day.date),
              status: 'BLOCKED',
            });
          }
        } else if (change < 0) {
          reopen.push(...closedRows.slice(0, -change));
        }
      }
      // An `AVAILABLE` row would collide with a new `BLOCKED` one. It carries nothing, so all of them in the range go
      // in one statement (one condition per room and day could pass Postgres' bind parameter limit).
      if (close.length) {
        await tx.roomCalendars.deleteMany({
          where: {
            status: 'AVAILABLE',
            roomId: { in: [...new Set(close.map((c) => c.roomId))] },
            date: { gte: fromCalendarDate(from), lte: fromCalendarDate(to) },
          },
        });
        await tx.roomCalendars.createMany({ data: close });
      }
      await tx.roomCalendars.deleteMany({
        where: { roomCalendarId: { in: reopen } },
      });

      return (await this.days(tx, [roomTypeId], from, to)).map((s) => s.day);
    });
  }

  /** Rooms of each type free on every night `checkIn` … `checkOut − 1` (BR-02). */
  async availableRooms(
    roomTypeIds: string[],
    checkIn: string,
    checkOut: string,
    db: Db = this.prisma,
  ): Promise<Map<string, number>> {
    const states = roomTypeIds.length
      ? await this.days(db, roomTypeIds, checkIn, addDays(checkOut, -1))
      : [];
    const available = new Map<string, number>();
    for (const { day } of states) {
      const current = available.get(day.roomTypeId) ?? day.onSale;
      available.set(day.roomTypeId, Math.min(current, day.onSale));
    }
    return available;
  }

  private async days(
    db: Db,
    roomTypeIds: string[],
    from: string,
    to: string,
  ): Promise<DayState[]> {
    const rooms = await db.room.findMany({
      where: { roomTypeId: { in: roomTypeIds } },
      select: { roomId: true, roomTypeId: true, status: true },
      orderBy: { roomNumber: 'asc' },
    });
    const rows = await db.roomCalendars.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.roomId) },
        date: { gte: fromCalendarDate(from), lte: fromCalendarDate(to) },
      },
      select: { roomCalendarId: true, roomId: true, date: true, status: true },
    });
    const rowsByDay = new Map<string, typeof rows>();
    for (const row of rows) {
      const date = toCalendarDate(row.date);
      rowsByDay.set(date, [...(rowsByDay.get(date) ?? []), row]);
    }

    const dates = Array.from({ length: daysBetween(from, to) + 1 }, (_, i) =>
      addDays(from, i),
    );
    return roomTypeIds.flatMap((roomTypeId) => {
      const own = rooms.filter((r) => r.roomTypeId === roomTypeId);
      const sellable = new Set(
        own.filter((r) => r.status !== 'MAINTENANCE').map((r) => r.roomId),
      );
      const ownIds = new Set(own.map((r) => r.roomId));

      return dates.map((date) => {
        const dayRows = (rowsByDay.get(date) ?? []).filter((r) =>
          ownIds.has(r.roomId),
        );
        // Nights sold or held count even on a room locked later: staff move the guest to another room (BR-10).
        const booked = dayRows.filter((r) => r.status === 'BOOKED').length;
        const held = dayRows.filter((r) => r.status === 'HELD').length;
        const closedRows = dayRows
          .filter((r) => r.status === 'BLOCKED' && sellable.has(r.roomId))
          .map((r) => r.roomCalendarId);
        const taken = new Set(
          dayRows.filter((r) => r.status !== 'AVAILABLE').map((r) => r.roomId),
        );
        const totalRooms = sellable.size;
        const maxOnSale = Math.max(0, totalRooms - booked - held);
        return {
          day: {
            roomTypeId,
            date,
            totalRooms,
            booked,
            held,
            closed: closedRows.length,
            onSale: Math.max(0, maxOnSale - closedRows.length),
          },
          maxOnSale,
          openRooms: [...sellable].filter((id) => !taken.has(id)),
          closedRows,
        };
      });
    });
  }
}
