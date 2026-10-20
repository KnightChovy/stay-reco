-- audit_log: at most one actor. Events without an actor (e.g. a failed login with an unknown email) are allowed.
ALTER TABLE audit_log ADD CONSTRAINT audit_log_one_actor CHECK (
  num_nonnulls(customer_id, hotel_staff_id, hotel_partner_id, admin_id, platform_manager_id) <= 1);

-- wallet: never owned by a customer and a hotel at the same time
ALTER TABLE wallet ADD CONSTRAINT wallet_single_owner CHECK (
  NOT (customer_id IS NOT NULL AND hotel_id IS NOT NULL));

-- The HNSW index on content_embedding.embedding is added later with the RAG module.
-- Prisma cannot declare it in schema.prisma, so every new migration would try to drop it.
