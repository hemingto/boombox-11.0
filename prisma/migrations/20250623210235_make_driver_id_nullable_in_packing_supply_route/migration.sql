-- DropForeignKey
ALTER TABLE "PackingSupplyRoute" DROP CONSTRAINT "PackingSupplyRoute_driverId_fkey";

-- AlterTable
ALTER TABLE "PackingSupplyRoute" ALTER COLUMN "driverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PackingSupplyRoute" ADD CONSTRAINT "PackingSupplyRoute_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
