import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRoomInput,
  Room,
  RoomListQuery,
  UpdateRoomInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { escapeLike } from '../../common/db/like';
import { lockHotel } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import type { Prisma, Room as RoomRow } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { toRoom } from './room.mapper';
import { roomTypeNotFound } from './room-types.service';

const roomNotFound = () =>
  new NotFoundException({
    code: ErrorCode.ROOM_NOT_FOUND,
    message: 'Room not found',
  });

const notLockable = (message: string) =>
  new ConflictException({ code: ErrorCode.ROOM_NOT_LOCKABLE, message });

// Numeric-aware, so room 101 comes before 1001 (a plain string sort puts 1001 first).
const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});
export const byRoomNumber = (a: string, b: string) => collator.compare(a, b);
const floorOrder = (floor: number | null, direction: 1 | -1) =>
  floor === null ? Number.POSITIVE_INFINITY : floor * direction;

const COMPARE: Record<
  RoomListQuery['sort'],
  (a: RoomRow, b: RoomRow) => number
> = {
  'room-number-asc': (a, b) => byRoomNumber(a.roomNumber, b.roomNumber),
  'room-number-desc': (a, b) => byRoomNumber(b.roomNumber, a.roomNumber),
  'floor-asc': (a, b) =>
    floorOrder(a.floor, 1) - floorOrder(b.floor, 1) ||
    byRoomNumber(a.roomNumber, b.roomNumber),
  'floor-desc': (a, b) =>
    floorOrder(a.floor, -1) - floorOrder(b.floor, -1) ||
    byRoomNumber(a.roomNumber, b.roomNumber),
};

/**
 * Physical rooms. `room` has no `hotel_id` column, so "room number unique per hotel" and "at most `totalRooms`"
 * are checked in code under the hotel row lock (see `lockHotel`), which room creation and room-config share.
 */
@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /**
   * `hotelId` was checked by `HotelAccessRequired`. `search` matches the room number. Sorting and paging happen in
   * memory because the database cannot order room numbers naturally; a hotel has at most `totalRooms` rooms.
   */
  async list(hotelId: string, query: RoomListQuery): Promise<Paginated<Room>> {
    const rooms = await this.prisma.room.findMany({
      where: {
        roomType: { hotelId },
        roomTypeId: query.roomTypeId,
        status: query.status,
        ...(query.search && {
          roomNumber: {
            contains: escapeLike(query.search),
            mode: 'insensitive',
          },
        }),
      },
    });
    const { skip, take } = pageArgs(query);
    const page = rooms.sort(COMPARE[query.sort]).slice(skip, skip + take);
    return Paginated.of(page.map(toRoom), { ...query, total: rooms.length });
  }

  /** Needs a room configuration first: `totalRooms` is the cap (contract D4). */
  async create(hotelId: string, input: CreateRoomInput): Promise<Room> {
    const room = await this.prisma.$transaction(async (tx) => {
      await lockHotel(tx, hotelId);
      await this.assertRoomType(tx, hotelId, input.roomTypeId);

      const config = await tx.hotelRoomConfig.findUnique({
        where: { hotelId },
        select: { totalRooms: true },
      });
      const rooms = await tx.room.count({ where: { roomType: { hotelId } } });
      if (!config || rooms >= config.totalRooms) {
        throw new ConflictException({
          code: ErrorCode.ROOM_LIMIT_REACHED,
          message: config
            ? `The room configuration allows ${config.totalRooms} rooms`
            : 'Set the room configuration (total rooms) first',
        });
      }

      await this.assertNumberFree(tx, hotelId, input.roomNumber);
      return tx.room.create({ data: input });
    });
    return toRoom(room);
  }

  async update(
    user: AuthUser,
    roomId: string,
    input: UpdateRoomInput,
  ): Promise<Room> {
    const { hotelId } = await this.findForOwner(user, roomId);
    const room = await this.prisma.$transaction(async (tx) => {
      await lockHotel(tx, hotelId);
      if (input.roomTypeId) {
        await this.assertRoomType(tx, hotelId, input.roomTypeId);
      }
      if (input.roomNumber) {
        await this.assertNumberFree(tx, hotelId, input.roomNumber, roomId);
      }
      return tx.room.update({ where: { roomId }, data: input });
    });
    return toRoom(room);
  }

  /** Takes the room out of sale (MAINTENANCE). A room with a guest (OCCUPIED) cannot be locked. */
  async lock(
    user: AuthUser,
    roomId: string,
    reason: string | undefined,
    meta: RequestMeta,
  ): Promise<Room> {
    await this.findForOwner(user, roomId);
    // Conditional update: a check-in landing between a read and the write cannot be overwritten.
    const { count } = await this.prisma.room.updateMany({
      where: { roomId, status: { not: 'OCCUPIED' } },
      data: { status: 'MAINTENANCE' },
    });
    if (!count) throw notLockable('The room is occupied');

    await this.audit.log(AuditAction.ROOM_LOCKED, user.accountId, meta, {
      roomId,
      reason: reason ?? null,
    });
    return this.load(roomId);
  }

  /** Puts a locked (MAINTENANCE) room back on sale. */
  async unlock(
    user: AuthUser,
    roomId: string,
    meta: RequestMeta,
  ): Promise<Room> {
    await this.findForOwner(user, roomId);
    const { count } = await this.prisma.room.updateMany({
      where: { roomId, status: 'MAINTENANCE' },
      data: { status: 'AVAILABLE' },
    });
    if (!count) throw notLockable('Only a locked room can be unlocked');

    await this.audit.log(AuditAction.ROOM_UNLOCKED, user.accountId, meta, {
      roomId,
    });
    return this.load(roomId);
  }

  private async load(roomId: string): Promise<Room> {
    return toRoom(
      await this.prisma.room.findUniqueOrThrow({ where: { roomId } }),
    );
  }

  /** Outsiders get ROOM_NOT_FOUND; staff get 403 (only the owner manages rooms here). */
  private async findForOwner(user: AuthUser, roomId: string) {
    const room = isUuid(roomId)
      ? await this.prisma.room.findUnique({
          where: { roomId },
          select: { roomType: { select: { hotelId: true } } },
        })
      : null;
    await this.access.assertResource(
      user,
      room?.roomType.hotelId,
      'owner',
      roomNotFound,
    );
    return { hotelId: room!.roomType.hotelId };
  }

  /** The room type must belong to the same hotel. */
  private async assertRoomType(
    tx: Prisma.TransactionClient,
    hotelId: string,
    roomTypeId: string,
  ) {
    const found = await tx.roomType.count({ where: { roomTypeId, hotelId } });
    if (!found) throw roomTypeNotFound();
  }

  /** Case-insensitive, so "101a" and "101A" are the same room. */
  private async assertNumberFree(
    tx: Prisma.TransactionClient,
    hotelId: string,
    roomNumber: string,
    exceptRoomId?: string,
  ) {
    const taken = await tx.room.count({
      where: {
        roomType: { hotelId },
        roomNumber: { equals: escapeLike(roomNumber), mode: 'insensitive' },
        ...(exceptRoomId && { roomId: { not: exceptRoomId } }),
      },
    });
    if (taken) {
      throw new ConflictException({
        code: ErrorCode.ROOM_NUMBER_TAKEN,
        message: `Room ${roomNumber} already exists in this hotel`,
      });
    }
  }
}
