-- One platform-wide loyalty programme at most. The unique key on hotel_id
-- leaves the platform rows (hotel_id NULL) unconstrained, because two NULLs
-- are distinct in Postgres; with two of them the earning and the partner
-- screens could read different rows. Prisma cannot declare this partial
-- index, so, like "content_report_whole_review_unique", every later migration
-- must be created with --create-only and any generated DROP INDEX line removed.
CREATE UNIQUE INDEX "loyalty_program_one_platform_row"
  ON "loyalty_program" ((true))
  WHERE "hotel_id" IS NULL;
