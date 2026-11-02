-- AlterEnum
-- New request types: cloud resources and repositories, access keys and tokens, security reviews, and onboarding / offboarding.
ALTER TYPE "RequestType" ADD VALUE 'CLOUD_RESOURCE';
ALTER TYPE "RequestType" ADD VALUE 'API_CREDENTIAL';
ALTER TYPE "RequestType" ADD VALUE 'SECURITY_REVIEW';
ALTER TYPE "RequestType" ADD VALUE 'ONBOARDING';
ALTER TYPE "RequestType" ADD VALUE 'OFFBOARDING';
