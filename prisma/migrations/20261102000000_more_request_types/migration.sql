-- AlterEnum
-- New request types: data and reporting, deployment and configuration, training and documents, and infrastructure.
ALTER TYPE "RequestType" ADD VALUE 'DATA_EXTRACT';
ALTER TYPE "RequestType" ADD VALUE 'DATA_CORRECTION';
ALTER TYPE "RequestType" ADD VALUE 'BULK_IMPORT';
ALTER TYPE "RequestType" ADD VALUE 'REPORT_TEMPLATE';
ALTER TYPE "RequestType" ADD VALUE 'SYSTEM_CONFIG';
ALTER TYPE "RequestType" ADD VALUE 'DEPLOYMENT';
ALTER TYPE "RequestType" ADD VALUE 'BACKUP_RESTORE';
ALTER TYPE "RequestType" ADD VALUE 'TRAINING';
ALTER TYPE "RequestType" ADD VALUE 'DOCUMENT';
ALTER TYPE "RequestType" ADD VALUE 'ENVIRONMENT';
ALTER TYPE "RequestType" ADD VALUE 'FIREWALL';
ALTER TYPE "RequestType" ADD VALUE 'RESOURCE_UPGRADE';
