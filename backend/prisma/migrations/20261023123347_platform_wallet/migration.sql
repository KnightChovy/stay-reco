-- Platform wallet (money-rules §5): StayReco's own share (commission, platform-side adjustments) gets a wallet like
-- hotels and customers, so revenue has a running balance and the sum of all wallets reconciles with the bank account.

-- CreateEnum
CREATE TYPE "wallet_owner_type" AS ENUM ('CUSTOMER', 'HOTEL', 'PLATFORM');

-- Existing wallets get their type from the owner column that is set.
ALTER TABLE "wallet" ADD COLUMN "owner_type" "wallet_owner_type";
UPDATE "wallet"
SET "owner_type" = (CASE WHEN "customer_id" IS NOT NULL THEN 'CUSTOMER' ELSE 'HOTEL' END)::"wallet_owner_type";
ALTER TABLE "wallet" ALTER COLUMN "owner_type" SET NOT NULL;

-- Exactly one owner, matching the type; the platform wallet has neither owner column.
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_owner_shape" CHECK (
  ("owner_type" = 'CUSTOMER' AND "customer_id" IS NOT NULL AND "hotel_id" IS NULL)
  OR ("owner_type" = 'HOTEL' AND "hotel_id" IS NOT NULL AND "customer_id" IS NULL)
  OR ("owner_type" = 'PLATFORM' AND "customer_id" IS NULL AND "hotel_id" IS NULL)
);

-- A single platform wallet: it has a fixed id, and no other row may be PLATFORM.
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_single_platform" CHECK (
  "owner_type" <> 'PLATFORM' OR "wallet_id" = '00000000-0000-0000-0000-000000000001'
);

INSERT INTO "wallet" ("wallet_id", "owner_type", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'PLATFORM', now())
ON CONFLICT ("wallet_id") DO NOTHING;
