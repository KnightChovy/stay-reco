-- A campaign that applies only through personal codes (vouchers), never to a stay by itself.
-- Until now "has issued a voucher" was what marked it, so a campaign meant for chosen customers applied to everyone
-- until its first code went out. The campaigns that already issued codes keep behaving as they did.
ALTER TABLE "promotion" ADD COLUMN "requires_code" BOOLEAN NOT NULL DEFAULT false;

UPDATE "promotion" p
SET "requires_code" = true
WHERE EXISTS (SELECT 1 FROM "voucher" v WHERE v."promotion_id" = p."promotion_id");
