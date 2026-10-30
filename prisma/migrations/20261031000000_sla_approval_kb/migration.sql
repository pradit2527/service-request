-- CreateEnum
CREATE TYPE "SlaTier" AS ENUM ('STANDARD', 'PROVISIONING', 'HARDWARE', 'COMPLEX');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventAction" ADD VALUE 'SLA_CHANGED';
ALTER TYPE "EventAction" ADD VALUE 'APPROVER_CHANGED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "RequestStatus" ADD VALUE 'ON_HOLD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestType" ADD VALUE 'HARDWARE';
ALTER TYPE "RequestType" ADD VALUE 'NETWORK_WORKPLACE';
ALTER TYPE "RequestType" ADD VALUE 'CONSULTATION';

-- AlterTable
ALTER TABLE "tbl_service_requests" ADD COLUMN     "approver_id" TEXT,
ADD COLUMN     "first_response_at" TIMESTAMP(3),
ADD COLUMN     "fulfillment_due_at" TIMESTAMP(3),
ADD COLUMN     "manager_approved_at" TIMESTAMP(3),
ADD COLUMN     "requested_for_name" TEXT,
ADD COLUMN     "response_due_at" TIMESTAMP(3),
ADD COLUMN     "sla_paused_at" TIMESTAMP(3),
ADD COLUMN     "sla_paused_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sla_tier" "SlaTier" NOT NULL DEFAULT 'PROVISIONING';

-- AlterTable
ALTER TABLE "tbl_users" ADD COLUMN     "is_approver" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tbl_kb_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_kb_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_kb_articles_is_published_category_idx" ON "tbl_kb_articles"("is_published", "category");

-- CreateIndex
CREATE INDEX "tbl_kb_articles_updated_at_idx" ON "tbl_kb_articles"("updated_at");

-- CreateIndex
CREATE INDEX "tbl_service_requests_status_fulfillment_due_at_idx" ON "tbl_service_requests"("status", "fulfillment_due_at");

-- CreateIndex
CREATE INDEX "tbl_service_requests_approver_id_status_idx" ON "tbl_service_requests"("approver_id", "status");

-- CreateIndex
CREATE INDEX "tbl_users_is_approver_is_active_idx" ON "tbl_users"("is_approver", "is_active");

-- AddForeignKey
ALTER TABLE "tbl_service_requests" ADD CONSTRAINT "tbl_service_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_kb_articles" ADD CONSTRAINT "tbl_kb_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

