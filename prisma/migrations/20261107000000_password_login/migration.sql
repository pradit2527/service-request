-- AlterTable: sign in with an email and a password, next to Google.
-- Every column is optional or has a default, so existing users are untouched: nobody has a password until they set one
-- or an administrator gives them a temporary one.
ALTER TABLE "tbl_users" ADD COLUMN "password_hash" TEXT,
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "password_changed_at" TIMESTAMP(3),
ADD COLUMN "failed_login_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMP(3);
