/*
  Warnings:

  - You are about to drop the column `routePrice` on the `HaulingPartner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HaulingPartner" DROP COLUMN "routePrice",
ADD COLUMN     "pricePerBoombox" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "boomboxCapacity" INTEGER;
