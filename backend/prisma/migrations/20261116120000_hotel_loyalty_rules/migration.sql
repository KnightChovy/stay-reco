-- DropForeignKey
ALTER TABLE "loyalty_program" DROP CONSTRAINT "loyalty_program_hotel_id_fkey";

-- AlterTable
ALTER TABLE "loyalty_program" ADD COLUMN     "accepts_points" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_redeem_percent" DECIMAL(5,2) NOT NULL DEFAULT 100;

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_program_hotel_id_key" ON "loyalty_program"("hotel_id");

-- AddForeignKey
ALTER TABLE "loyalty_program" ADD CONSTRAINT "loyalty_program_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

