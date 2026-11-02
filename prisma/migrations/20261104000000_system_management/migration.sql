-- AlterEnum
-- The new values are not used in this migration (a new enum value cannot be used in the transaction that adds it).
ALTER TYPE "EventAction" ADD VALUE 'EDITED';
ALTER TYPE "EventAction" ADD VALUE 'DELETED';
ALTER TYPE "EventAction" ADD VALUE 'RESTORED';

-- AlterTable: soft delete for requests
ALTER TABLE "tbl_service_requests" ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "deleted_by_id" TEXT;

-- CreateTable
CREATE TABLE "tbl_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_audit_logs_created_at_idx" ON "tbl_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "tbl_audit_logs_entity_entity_id_idx" ON "tbl_audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "tbl_service_requests_deleted_at_idx" ON "tbl_service_requests"("deleted_at");

-- AddForeignKey
ALTER TABLE "tbl_service_requests" ADD CONSTRAINT "tbl_service_requests_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_audit_logs" ADD CONSTRAINT "tbl_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
