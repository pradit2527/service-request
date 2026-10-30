-- The "approver" flag on a user becomes a role of its own: MANAGER.
-- Employees who had the flag become managers. IT staff or admins who had it keep their role and lose the
-- approval right (a manager is not IT staff); the IT team can move any request still waiting on them to
-- another manager from the request page.
UPDATE "tbl_users" SET "role" = 'MANAGER' WHERE "is_approver" = true AND "role" = 'EMPLOYEE';

-- DropIndex
DROP INDEX "tbl_users_is_approver_is_active_idx";

-- AlterTable
ALTER TABLE "tbl_users" DROP COLUMN "is_approver";
