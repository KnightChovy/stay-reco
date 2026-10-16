/*
  Warnings:

  - Added the required column `hotel_id` to the `hotel_verification_request` table without a default value. This is not possible if the table is not empty.
  - Made the column `hotel_partner_id` on table `policy_violation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ai_config" DROP CONSTRAINT "ai_config_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_config" DROP CONSTRAINT "ai_config_hotel_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_function_call" DROP CONSTRAINT "ai_function_call_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "hotel_properties" DROP CONSTRAINT "hotel_properties_verification_document_id_fkey";

-- DropForeignKey
ALTER TABLE "hotel_verification_request" DROP CONSTRAINT "hotel_verification_request_platform_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "policy_violation" DROP CONSTRAINT "policy_violation_hotel_partner_id_fkey";

-- AlterTable
ALTER TABLE "ai_config" ALTER COLUMN "admin_id" DROP NOT NULL,
ALTER COLUMN "hotel_partner_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ai_function_call" ALTER COLUMN "booking_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hotel_properties" ALTER COLUMN "verification_document_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hotel_verification_request" ADD COLUMN     "hotel_id" UUID NOT NULL,
ALTER COLUMN "platform_manager_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "policy_violation" ALTER COLUMN "hotel_partner_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "review" ALTER COLUMN "title" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ai_config" ADD CONSTRAINT "ai_config_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_config" ADD CONSTRAINT "ai_config_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_function_call" ADD CONSTRAINT "ai_function_call_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_properties" ADD CONSTRAINT "hotel_properties_verification_document_id_fkey" FOREIGN KEY ("verification_document_id") REFERENCES "hotel_verification_document"("verification_document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_request" ADD CONSTRAINT "hotel_verification_request_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_request" ADD CONSTRAINT "hotel_verification_request_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violation" ADD CONSTRAINT "policy_violation_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ai_config: owned by exactly one of admin (platform-wide config) or hotel partner (brand voice config)
ALTER TABLE ai_config ADD CONSTRAINT ai_config_single_owner CHECK (
  num_nonnulls(admin_id, hotel_partner_id) = 1);
