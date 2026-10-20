-- CreateEnum
CREATE TYPE "staff_permission" AS ENUM ('BOOKING', 'FRONT_DESK', 'CUSTOMER_CARE', 'REFUND', 'MARKETING');

-- AlterTable
ALTER TABLE "hotel_staff" ADD COLUMN     "permissions" "staff_permission"[] DEFAULT ARRAY[]::"staff_permission"[];

-- CreateTable
CREATE TABLE "hotel_image" (
    "hotel_image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "caption" VARCHAR(255),
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_image_pkey" PRIMARY KEY ("hotel_image_id")
);

-- CreateTable
CREATE TABLE "room_type_image" (
    "room_type_image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "caption" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_type_image_pkey" PRIMARY KEY ("room_type_image_id")
);

-- CreateIndex
CREATE INDEX "hotel_image_hotel_id_idx" ON "hotel_image"("hotel_id");

-- CreateIndex
CREATE INDEX "room_type_image_room_type_id_idx" ON "room_type_image"("room_type_id");

-- AddForeignKey
ALTER TABLE "hotel_image" ADD CONSTRAINT "hotel_image_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_image" ADD CONSTRAINT "room_type_image_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE CASCADE ON UPDATE CASCADE;
