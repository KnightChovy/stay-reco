-- CreateTable
CREATE TABLE "ai_usage" (
    "ai_usage_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "hotel_staff_id" UUID,
    "purpose" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cache_read_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(12,6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("ai_usage_id")
);

-- CreateIndex
CREATE INDEX "ai_usage_hotel_id_created_at_idx" ON "ai_usage"("hotel_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_hotel_staff_id_fkey" FOREIGN KEY ("hotel_staff_id") REFERENCES "hotel_staff"("hotel_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;
