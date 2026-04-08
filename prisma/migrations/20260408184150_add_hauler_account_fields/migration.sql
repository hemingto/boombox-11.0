-- AlterTable
ALTER TABLE "HaulingPartner" ADD COLUMN     "californiaMcpNumber" TEXT,
ADD COLUMN     "insuranceDocumentUrl" TEXT,
ADD COLUMN     "routePrice" DOUBLE PRECISION,
ADD COLUMN     "usdotNumber" TEXT,
ADD COLUMN     "verifiedPhoneNumber" BOOLEAN NOT NULL DEFAULT false;
