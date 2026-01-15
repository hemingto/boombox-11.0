-- CreateEnum
CREATE TYPE "DriverAssignmentMode" AS ENUM ('MANUAL', 'AUTO');

-- AlterTable
ALTER TABLE "MovingPartner" ADD COLUMN     "driverAssignmentMode" "DriverAssignmentMode" NOT NULL DEFAULT 'MANUAL';
