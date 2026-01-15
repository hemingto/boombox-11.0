-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "activeMessageShown" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MovingPartner" ADD COLUMN     "activeMessageShown" BOOLEAN NOT NULL DEFAULT false;
