CREATE UNIQUE INDEX "recommendation_model_run_id_customer_id_hotel_id_key"
ON "recommendation"("model_run_id", "customer_id", "hotel_id");

CREATE INDEX "recommendation_customer_id_model_run_id_idx"
ON "recommendation"("customer_id", "model_run_id");
