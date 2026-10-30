-- The workflow is now: requester submits -> manager approves -> IT does the work -> completed.
-- The two statuses of the old flow (an IT "review" and an IT "approval") are folded into "in progress".
-- The enum values stay in the database so the history of older requests can still be read.
UPDATE "tbl_service_requests" SET "status" = 'IN_PROGRESS' WHERE "status" IN ('IN_REVIEW', 'APPROVED');
