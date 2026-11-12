-- CreateEnum
CREATE TYPE "report_reason" AS ENUM ('OFFENSIVE', 'NOT_A_STAY', 'PERSONAL_DATA', 'SPAM_OR_ADVERT', 'WRONG_HOTEL', 'AI_GENERATED', 'OTHER');

-- CreateTable
CREATE TABLE "review_image" (
    "review_image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_image_pkey" PRIMARY KEY ("review_image_id")
);

-- CreateTable
CREATE TABLE "content_report" (
    "content_report_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "review_image_id" UUID,
    "reason" "report_reason" NOT NULL,
    "note" TEXT,
    "status" "violation_status" NOT NULL DEFAULT 'OPEN',
    "platform_manager_id" UUID,
    "resolution" TEXT,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_report_pkey" PRIMARY KEY ("content_report_id")
);

-- CreateIndex
CREATE INDEX "review_image_review_id_idx" ON "review_image"("review_id");

-- CreateIndex
CREATE INDEX "content_report_status_created_at_idx" ON "content_report"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "content_report_reporter_id_review_id_review_image_id_key" ON "content_report"("reporter_id", "review_id", "review_image_id");

-- AddForeignKey
ALTER TABLE "review_image" ADD CONSTRAINT "review_image_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "review"("review_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "review"("review_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_review_image_id_fkey" FOREIGN KEY ("review_image_id") REFERENCES "review_image"("review_image_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE SET NULL ON UPDATE CASCADE;
