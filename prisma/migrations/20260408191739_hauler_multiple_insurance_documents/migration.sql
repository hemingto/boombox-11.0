/*
  Warnings:

  - You are about to drop the column `insuranceDocumentUrl` on the `HaulingPartner` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HaulingPartner" DROP COLUMN "insuranceDocumentUrl",
ADD COLUMN     "insuranceDocumentUrls" TEXT[];
