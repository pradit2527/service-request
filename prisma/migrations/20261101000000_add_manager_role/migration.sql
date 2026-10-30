-- AlterEnum
-- A new enum value cannot be used in the transaction that adds it, so the data move happens in the next migration.
ALTER TYPE "Role" ADD VALUE 'MANAGER' AFTER 'EMPLOYEE';
