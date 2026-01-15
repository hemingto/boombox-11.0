-- AlterTable
ALTER TABLE "OnfleetTask" ADD COLUMN     "actualDistanceMiles" DOUBLE PRECISION,
ADD COLUMN     "actualDriveTimeMinutes" DOUBLE PRECISION,
ADD COLUMN     "driveTimePay" DOUBLE PRECISION,
ADD COLUMN     "estimatedDriveTimeMinutes" DOUBLE PRECISION,
ADD COLUMN     "fixedFeePay" DOUBLE PRECISION,
ADD COLUMN     "mileagePay" DOUBLE PRECISION,
ADD COLUMN     "serviceTimePay" DOUBLE PRECISION;
