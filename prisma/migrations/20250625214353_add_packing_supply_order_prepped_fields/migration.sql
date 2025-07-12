-- AlterTable
ALTER TABLE "PackingSupplyOrder" ADD COLUMN     "isPrepped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preppedAt" TIMESTAMP(3),
ADD COLUMN     "preppedBy" INTEGER;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrder" ADD CONSTRAINT "PackingSupplyOrder_preppedBy_fkey" FOREIGN KEY ("preppedBy") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
