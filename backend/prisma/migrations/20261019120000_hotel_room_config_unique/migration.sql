-- One room configuration per hotel (contract D4).
-- CreateIndex
CREATE UNIQUE INDEX "hotel_room_config_hotel_id_key" ON "hotel_room_config"("hotel_id");
