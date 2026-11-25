-- AlterTable
ALTER TABLE "content_schedule" ADD COLUMN     "external_post_id" VARCHAR(255),
ADD COLUMN     "failure_reason" VARCHAR(1000);

-- CreateIndex
CREATE INDEX "content_schedule_status_scheduled_at_idx" ON "content_schedule"("status", "scheduled_at");
