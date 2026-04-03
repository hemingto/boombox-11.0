/*
  Warnings:

  - You are about to drop the column `arrivedAt` on the `OnfleetTask` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OnfleetTask" DROP COLUMN "arrivedAt";

-- AlterTable
ALTER TABLE "StorageUnitUsage" ADD COLUMN     "isStoringItems" BOOLEAN,
ADD COLUMN     "padlockProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnProcessedAt" TIMESTAMP(3);
