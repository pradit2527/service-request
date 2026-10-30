-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'IT_STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('AWS_SERVER', 'DATABASE', 'PUBLIC_IP_DOMAIN', 'ACCESS_ACCOUNT', 'SOFTWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'NEED_INFO', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EventAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNED');

-- CreateTable
CREATE TABLE "tbl_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "google_sub" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_service_requests" (
    "id" TEXT NOT NULL,
    "request_no" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "details" JSONB NOT NULL DEFAULT '{}',
    "needed_by" TIMESTAMP(3),
    "requester_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_request_comments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_request_events" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" "EventAction" NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_request_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_counters" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tbl_counters_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_email_key" ON "tbl_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_google_sub_key" ON "tbl_users"("google_sub");

-- CreateIndex
CREATE INDEX "tbl_users_role_is_active_idx" ON "tbl_users"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_service_requests_request_no_key" ON "tbl_service_requests"("request_no");

-- CreateIndex
CREATE INDEX "tbl_service_requests_status_created_at_idx" ON "tbl_service_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "tbl_service_requests_requester_id_created_at_idx" ON "tbl_service_requests"("requester_id", "created_at");

-- CreateIndex
CREATE INDEX "tbl_service_requests_assignee_id_status_idx" ON "tbl_service_requests"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "tbl_service_requests_type_idx" ON "tbl_service_requests"("type");

-- CreateIndex
CREATE INDEX "tbl_request_comments_request_id_created_at_idx" ON "tbl_request_comments"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "tbl_request_events_request_id_created_at_idx" ON "tbl_request_events"("request_id", "created_at");

-- AddForeignKey
ALTER TABLE "tbl_service_requests" ADD CONSTRAINT "tbl_service_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_service_requests" ADD CONSTRAINT "tbl_service_requests_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_service_requests" ADD CONSTRAINT "tbl_service_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "tbl_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_request_comments" ADD CONSTRAINT "tbl_request_comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tbl_service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_request_comments" ADD CONSTRAINT "tbl_request_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_request_events" ADD CONSTRAINT "tbl_request_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tbl_service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_request_events" ADD CONSTRAINT "tbl_request_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

