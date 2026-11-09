-- Bookings with several room types (docs/design/booking-items.md): the room lines move from booking to booking_item,
-- and the hotel is kept on the booking. Every existing booking becomes one item.

-- CreateTable
CREATE TABLE "booking_item" (
    "booking_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "num_rooms" INTEGER NOT NULL,
    "nightly_prices" JSONB NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "booking_item_pkey" PRIMARY KEY ("booking_item_id"),
    CONSTRAINT "booking_item_num_rooms_range" CHECK ("num_rooms" BETWEEN 1 AND 8)
);

-- Backfill: the hotel from the room type, one item per booking (no discounts yet, so subtotal = total).
ALTER TABLE "booking" ADD COLUMN "hotel_id" UUID;

UPDATE "booking" b SET "hotel_id" = rt."hotel_id"
FROM "room_type" rt WHERE rt."room_type_id" = b."room_type_id";

INSERT INTO "booking_item" ("booking_id", "room_type_id", "num_rooms", "nightly_prices", "subtotal")
SELECT "booking_id", "room_type_id", "num_rooms", "nightly_prices", "total_amount" FROM "booking";

ALTER TABLE "booking" ALTER COLUMN "hotel_id" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_room_type_id_fkey";

-- DropIndex
DROP INDEX "booking_room_type_id_check_in_date_idx";

-- DropIndex
DROP INDEX "booking_room_type_id_created_at_idx";

-- AlterTable (drops the CHECK booking_num_rooms_range with num_rooms)
ALTER TABLE "booking" DROP COLUMN "nightly_prices",
DROP COLUMN "num_rooms",
DROP COLUMN "room_type_id";

-- CreateIndex
CREATE INDEX "booking_item_room_type_id_idx" ON "booking_item"("room_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_item_booking_id_room_type_id_key" ON "booking_item"("booking_id", "room_type_id");

-- CreateIndex
CREATE INDEX "booking_hotel_id_check_in_date_idx" ON "booking"("hotel_id", "check_in_date");

-- CreateIndex
CREATE INDEX "booking_hotel_id_created_at_idx" ON "booking"("hotel_id", "created_at");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_item" ADD CONSTRAINT "booking_item_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_item" ADD CONSTRAINT "booking_item_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
