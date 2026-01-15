-- AlterTable
ALTER TABLE "OnfleetTask" ADD COLUMN     "lastProcessedWebhookTime" BIGINT;

-- AlterTable
ALTER TABLE "PackingSupplyRoute" ADD COLUMN     "offeredDriverIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
