-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventAction" ADD VALUE 'INFO_REQUESTED';
ALTER TYPE "EventAction" ADD VALUE 'DECIDED_FOR';

-- AlterTable
ALTER TABLE "tbl_service_requests" ADD COLUMN     "info_answered_at" TIMESTAMP(3),
ADD COLUMN     "info_requested_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tbl_approval_delegations" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "delegate_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_approval_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_approval_delegations_manager_id_ends_at_idx" ON "tbl_approval_delegations"("manager_id", "ends_at");

-- CreateIndex
CREATE INDEX "tbl_approval_delegations_delegate_id_ends_at_idx" ON "tbl_approval_delegations"("delegate_id", "ends_at");

-- AddForeignKey
ALTER TABLE "tbl_approval_delegations" ADD CONSTRAINT "tbl_approval_delegations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "tbl_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_approval_delegations" ADD CONSTRAINT "tbl_approval_delegations_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "tbl_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

