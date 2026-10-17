-- AlterEnum
ALTER TYPE "account_status" ADD VALUE 'PENDING_VERIFICATION';

-- AlterTable
ALTER TABLE "verification_token" ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 0;
