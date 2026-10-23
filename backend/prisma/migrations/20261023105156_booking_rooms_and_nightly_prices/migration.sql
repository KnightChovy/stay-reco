-- Rooms and nightly prices of a booking, kept after its room_calendars rows are released (expiry, cancellation).
-- Bookings made before these columns get 1 room and no nightly breakdown; the defaults are dropped afterwards so new
-- bookings must always set both.

ALTER TABLE "booking" ADD COLUMN     "nightly_prices" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "num_rooms" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "booking" ALTER COLUMN "nightly_prices" DROP DEFAULT,
ALTER COLUMN "num_rooms" DROP DEFAULT;

ALTER TABLE "booking" ADD CONSTRAINT "booking_num_rooms_range" CHECK ("num_rooms" BETWEEN 1 AND 8);
