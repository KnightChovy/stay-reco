/*
  Warnings:

  - Added the required column `room_type_id` to the `booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "room_type_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
