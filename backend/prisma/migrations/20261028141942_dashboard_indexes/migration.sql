-- CreateIndex
CREATE INDEX "booking_room_type_id_check_in_date_idx" ON "booking"("room_type_id", "check_in_date");

-- CreateIndex
CREATE INDEX "booking_room_type_id_created_at_idx" ON "booking"("room_type_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transaction_wallet_id_created_at_idx" ON "wallet_transaction"("wallet_id", "created_at");
