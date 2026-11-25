-- AlterTable
ALTER TABLE "ai_usage" ADD COLUMN     "customer_id" UUID,
ALTER COLUMN "hotel_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ai_usage_customer_id_created_at_idx" ON "ai_usage"("customer_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
