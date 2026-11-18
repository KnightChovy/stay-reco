-- A report on a photo keeps a copy of where the photo is, so its author may
-- remove the photo without deleting the report: while open it is the evidence
-- a manager decides on, once decided the record of that decision.
ALTER TABLE "content_report" ADD COLUMN "image_url" VARCHAR(500),
ADD COLUMN "image_storage_key" VARCHAR(255);

-- Reports already raised on a photo still in place.
UPDATE "content_report" cr
SET "image_url" = ri."image_url", "image_storage_key" = ri."storage_key"
FROM "review_image" ri
WHERE ri."review_image_id" = cr."review_image_id";

-- Removing the photo now clears the link instead of deleting the report.
ALTER TABLE "content_report" DROP CONSTRAINT "content_report_review_image_id_fkey";
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_review_image_id_fkey" FOREIGN KEY ("review_image_id") REFERENCES "review_image"("review_image_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A report whose photo was removed also has review_image_id NULL, but it was
-- never a report of the whole review: it keeps its image_storage_key, and the
-- one-whole-review-report-per-person index must leave it out. Prisma cannot
-- declare this partial index: remove any generated DROP INDEX for it.
DROP INDEX "content_report_whole_review_unique";
CREATE UNIQUE INDEX "content_report_whole_review_unique"
  ON "content_report" ("reporter_id", "review_id")
  WHERE "review_image_id" IS NULL AND "image_storage_key" IS NULL;
