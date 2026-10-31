-- AlterEnum
ALTER TYPE "wallet_txn_type" ADD VALUE 'SETTLEMENT';

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "link" VARCHAR(500);

-- CreateIndex
CREATE INDEX "notification_user_account_id_created_at_idx" ON "notification"("user_account_id", "created_at" DESC);
