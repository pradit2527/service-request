-- AlterEnum
-- New request types: time on the GPU machines (Spark AI, Nvidia 5090) and access to AI services (Claude, Gemini, other).
ALTER TYPE "RequestType" ADD VALUE 'SPARK_AI';
ALTER TYPE "RequestType" ADD VALUE 'GPU_5090';
ALTER TYPE "RequestType" ADD VALUE 'CLAUDE_AI';
ALTER TYPE "RequestType" ADD VALUE 'GEMINI_AI';
ALTER TYPE "RequestType" ADD VALUE 'OTHER_AI';
