import type { Prisma } from '../../generated/prisma/client';

/**
 * Row locks for checks the database cannot express as a constraint (room numbers unique per hotel, room and image
 * limits). Call inside `prisma.$transaction(async (tx) => ...)`: concurrent transactions on the same row then run
 * one after another, so "count, then insert" stays correct. The lock is released when the transaction ends.
 * Each resolves to the number of rows locked: 0 means the row no longer exists.
 */
export const lockAccount = (tx: Prisma.TransactionClient, accountId: string) =>
  tx.$executeRaw`SELECT 1 FROM user_account WHERE user_account_id = ${accountId}::uuid FOR UPDATE`;

export const lockHotel = (tx: Prisma.TransactionClient, hotelId: string) =>
  tx.$executeRaw`SELECT 1 FROM hotel WHERE hotel_id = ${hotelId}::uuid FOR UPDATE`;

export const lockBooking = (tx: Prisma.TransactionClient, bookingId: string) =>
  tx.$executeRaw`SELECT 1 FROM booking WHERE booking_id = ${bookingId}::uuid FOR UPDATE`;

export const lockRoomType = (
  tx: Prisma.TransactionClient,
  roomTypeId: string,
) =>
  tx.$executeRaw`SELECT 1 FROM room_type WHERE room_type_id = ${roomTypeId}::uuid FOR UPDATE`;

/**
 * The room types of a booking, locked in id order so two transactions on the same types never wait on each other
 * (docs/design/booking-items.md).
 */
export async function lockRoomTypes(
  tx: Prisma.TransactionClient,
  roomTypeIds: string[],
) {
  for (const id of [...new Set(roomTypeIds)].sort()) {
    await lockRoomType(tx, id);
  }
}
