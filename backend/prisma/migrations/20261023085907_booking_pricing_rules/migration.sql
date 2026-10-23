-- Search, booking and pricing rules (docs/phases/phase-2-search-booking.md, "Schema changes").
-- Columns that become NOT NULL are added nullable first and filled from existing rows, so the migration also runs on
-- databases that already hold prices or bookings.

-- CreateExtension (accent-insensitive hotel search)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "price_rule_type" AS ENUM ('BASE', 'SEASON', 'EARLY_BIRD', 'LAST_MINUTE');

-- CreateEnum
CREATE TYPE "price_adjustment_type" AS ENUM ('SET_PRICE', 'AMOUNT', 'PERCENT');

-- AlterEnum: unpaid hold that ran out
ALTER TYPE "booking_status" ADD VALUE 'EXPIRED';

-- AlterEnum: cancelled with money to refund, waiting for the partner
ALTER TYPE "payment_status" ADD VALUE 'REFUND_PENDING';

-- ── price: pricing rules ───────────────────────────────────

ALTER TABLE "price" ADD COLUMN     "adjustment_type" "price_adjustment_type",
ADD COLUMN     "adjustment_value" DECIMAL(14,2),
ADD COLUMN     "max_days_before" INTEGER,
ADD COLUMN     "min_days_before" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rule_type" "price_rule_type",
ALTER COLUMN "price_per_night" DROP NOT NULL;

-- Existing rows without room, dates or weekday are the base prices (decision D3).
UPDATE "price" SET "rule_type" = 'BASE'
WHERE "room_id" IS NULL AND "valid_from" IS NULL AND "valid_to" IS NULL AND "day_of_week" IS NULL;

-- Any other row was a dated or weekday price: keep it as a seasonal rule that sets the nightly price.
UPDATE "price" SET "rule_type" = 'SEASON', "adjustment_type" = 'SET_PRICE',
  "adjustment_value" = "price_per_night", "price_per_night" = NULL
WHERE "rule_type" IS NULL;

ALTER TABLE "price" ALTER COLUMN "rule_type" SET NOT NULL;

-- A base price has a nightly price and no adjustment; every other rule has an adjustment.
ALTER TABLE "price" ADD CONSTRAINT "price_rule_shape" CHECK (
  ("rule_type" = 'BASE' AND "price_per_night" IS NOT NULL AND "adjustment_type" IS NULL AND "adjustment_value" IS NULL)
  OR ("rule_type" <> 'BASE' AND "adjustment_type" IS NOT NULL AND "adjustment_value" IS NOT NULL)
);

-- ── booking: guest details and terms fixed at booking time ─

ALTER TABLE "booking" ADD COLUMN     "arrival_time" TIME(0),
ADD COLUMN     "cancel_fee_percent" DECIMAL(5,2),
ADD COLUMN     "commission_rate" DECIMAL(5,2),
ADD COLUMN     "contact_phone" VARCHAR(20),
ADD COLUMN     "free_cancel_until" TIMESTAMPTZ(6),
ADD COLUMN     "guest_name" VARCHAR(100);

-- Bookings made before these columns: the booker is the guest, no free cancellation, the partner's current rate.
UPDATE "booking" AS b SET
  "guest_name" = LEFT(ua."full_name", 100),
  "contact_phone" = COALESCE(ua."phone", ''),
  "cancel_fee_percent" = 100,
  "commission_rate" = hp."commission_rate"
FROM "user_account" AS ua, "room_type" AS rt, "hotel" AS h, "hotel_partner" AS hp
WHERE ua."user_account_id" = b."customer_id"
  AND rt."room_type_id" = b."room_type_id"
  AND h."hotel_id" = rt."hotel_id"
  AND hp."hotel_partner_id" = h."hotel_partner_id";

ALTER TABLE "booking" ALTER COLUMN "cancel_fee_percent" SET NOT NULL,
ALTER COLUMN "commission_rate" SET NOT NULL,
ALTER COLUMN "contact_phone" SET NOT NULL,
ALTER COLUMN "guest_name" SET NOT NULL;

ALTER TABLE "booking" ADD CONSTRAINT "booking_terms_range" CHECK (
  "cancel_fee_percent" BETWEEN 0 AND 100 AND "commission_rate" BETWEEN 0 AND 100
);
