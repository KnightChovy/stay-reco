-- DropForeignKey
ALTER TABLE "loyalty_program" DROP CONSTRAINT "loyalty_program_hotel_id_fkey";

-- AlterTable
ALTER TABLE "loyalty_account" ADD COLUMN     "lifetime_points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "loyalty_program" ADD COLUMN     "point_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
ALTER COLUMN "hotel_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "loyalty_program" ADD CONSTRAINT "loyalty_program_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;
