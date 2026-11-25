-- AlterTable
ALTER TABLE "review_image" ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT true;

-- In Postgres two NULLs are distinct, so the unique key on
-- (reporter_id, review_id, review_image_id) does not stop the same person
-- reporting one whole review twice: both rows carry review_image_id NULL.
-- A partial index covers that case. Prisma cannot declare it, so, like the
-- planned HNSW index (CONVENTIONS section 3.8), every later migration must be
-- created with --create-only and any generated DROP INDEX line removed.
CREATE UNIQUE INDEX "content_report_whole_review_unique"
  ON "content_report" ("reporter_id", "review_id")
  WHERE "review_image_id" IS NULL;
