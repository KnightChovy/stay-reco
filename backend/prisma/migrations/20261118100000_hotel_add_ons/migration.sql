
-- CreateEnum
CREATE TYPE "AddOnTiming" AS ENUM ('BEFORE_STAY', 'DURING_STAY', 'AFTER_STAY');

-- CreateEnum
CREATE TYPE "AddOnPayment" AS ENUM ('PREPAID', 'FRONT_DESK');

-- CreateTable
CREATE TABLE "hotel_add_on" (
    "hotel_add_on_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "timing" "AddOnTiming" NOT NULL,
    "prebookable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotel_add_on_pkey" PRIMARY KEY ("hotel_add_on_id")
);

-- CreateTable
CREATE TABLE "booking_add_on" (
    "booking_add_on_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "hotel_add_on_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment" "AddOnPayment" NOT NULL,
    "added_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_add_on_pkey" PRIMARY KEY ("booking_add_on_id")
);

-- CreateIndex
CREATE INDEX "hotel_add_on_hotel_id_idx" ON "hotel_add_on"("hotel_id");

-- CreateIndex
CREATE INDEX "booking_add_on_booking_id_idx" ON "booking_add_on"("booking_id");

-- AddForeignKey
ALTER TABLE "hotel_add_on" ADD CONSTRAINT "hotel_add_on_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_on" ADD CONSTRAINT "booking_add_on_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_on" ADD CONSTRAINT "booking_add_on_hotel_add_on_id_fkey" FOREIGN KEY ("hotel_add_on_id") REFERENCES "hotel_add_on"("hotel_add_on_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A price is never negative and a line holds at least one unit.
ALTER TABLE "hotel_add_on" ADD CONSTRAINT "hotel_add_on_price_check" CHECK ("price" >= 0);
ALTER TABLE "booking_add_on" ADD CONSTRAINT "booking_add_on_quantity_check" CHECK ("quantity" > 0);
