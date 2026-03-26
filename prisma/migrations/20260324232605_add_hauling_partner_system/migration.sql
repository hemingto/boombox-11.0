-- CreateEnum
CREATE TYPE "HaulingPartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "HaulJobType" AS ENUM ('SSF_TO_STOCKTON', 'STOCKTON_TO_SSF', 'STOCKTON_DIRECT_DELIVERY');

-- CreateEnum
CREATE TYPE "HaulJobStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'HAULER';

-- AlterTable
ALTER TABLE "OnfleetTask" ADD COLUMN     "haulJobId" INTEGER;

-- AlterTable
ALTER TABLE "StorageUnitUsage" ADD COLUMN     "warehouseId" INTEGER;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "haulingPartnerId" INTEGER,
ADD COLUMN     "insuranceExpiration" TIMESTAMP(3),
ADD COLUMN     "interiorPhoto" TEXT,
ADD COLUMN     "unitCapacity" INTEGER,
ADD COLUMN     "vehicleCategory" TEXT,
ADD COLUMN     "vehicleType" TEXT;

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "hoursOpen" TEXT NOT NULL DEFAULT '08:30',
    "hoursClose" TEXT NOT NULL DEFAULT '16:30',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulingPartner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "website" TEXT,
    "description" TEXT,
    "imageSrc" TEXT,
    "numberOfEmployees" TEXT,
    "priceSsfToStockton" DOUBLE PRECISION,
    "priceStocktonToSsf" DOUBLE PRECISION,
    "trailerUnitCapacity" INTEGER NOT NULL DEFAULT 4,
    "onfleetTeamId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "applicationComplete" BOOLEAN NOT NULL DEFAULT false,
    "status" "HaulingPartnerStatus" NOT NULL DEFAULT 'INACTIVE',
    "stripeConnectAccountId" TEXT,
    "stripeConnectOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTermsAt" TIMESTAMP(3),
    "activeMessageShown" BOOLEAN NOT NULL DEFAULT false,
    "driverAssignmentMode" "DriverAssignmentMode" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaulingPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulJob" (
    "id" SERIAL NOT NULL,
    "jobCode" TEXT NOT NULL,
    "type" "HaulJobType" NOT NULL,
    "status" "HaulJobStatus" NOT NULL DEFAULT 'PENDING',
    "originWarehouseId" INTEGER NOT NULL,
    "destinationWarehouseId" INTEGER NOT NULL,
    "haulingPartnerId" INTEGER,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaulJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulJobUnit" (
    "id" SERIAL NOT NULL,
    "haulJobId" INTEGER NOT NULL,
    "storageUnitId" INTEGER NOT NULL,
    "loadConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "unloadConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "damageReported" BOOLEAN NOT NULL DEFAULT false,
    "damagePhotos" TEXT[],
    "warehouseLocation" TEXT,

    CONSTRAINT "HaulJobUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulingPartnerDriver" (
    "id" SERIAL NOT NULL,
    "haulingPartnerId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HaulingPartnerDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulingPartnerDriverInvitation" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "haulingPartnerId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "HaulingPartnerDriverInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulingPartnerAvailability" (
    "id" SERIAL NOT NULL,
    "haulingPartnerId" INTEGER NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "HaulingPartnerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HaulingPartner_email_key" ON "HaulingPartner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HaulingPartner_phoneNumber_key" ON "HaulingPartner"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HaulJob_jobCode_key" ON "HaulJob"("jobCode");

-- CreateIndex
CREATE INDEX "HaulJob_originWarehouseId_idx" ON "HaulJob"("originWarehouseId");

-- CreateIndex
CREATE INDEX "HaulJob_destinationWarehouseId_idx" ON "HaulJob"("destinationWarehouseId");

-- CreateIndex
CREATE INDEX "HaulJob_haulingPartnerId_idx" ON "HaulJob"("haulingPartnerId");

-- CreateIndex
CREATE INDEX "HaulJob_status_idx" ON "HaulJob"("status");

-- CreateIndex
CREATE INDEX "HaulJobUnit_haulJobId_idx" ON "HaulJobUnit"("haulJobId");

-- CreateIndex
CREATE INDEX "HaulJobUnit_storageUnitId_idx" ON "HaulJobUnit"("storageUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "HaulJobUnit_haulJobId_storageUnitId_key" ON "HaulJobUnit"("haulJobId", "storageUnitId");

-- CreateIndex
CREATE INDEX "HaulingPartnerDriver_haulingPartnerId_idx" ON "HaulingPartnerDriver"("haulingPartnerId");

-- CreateIndex
CREATE INDEX "HaulingPartnerDriver_driverId_idx" ON "HaulingPartnerDriver"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "HaulingPartnerDriver_haulingPartnerId_driverId_key" ON "HaulingPartnerDriver"("haulingPartnerId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "HaulingPartnerDriverInvitation_token_key" ON "HaulingPartnerDriverInvitation"("token");

-- CreateIndex
CREATE INDEX "HaulingPartnerDriverInvitation_token_idx" ON "HaulingPartnerDriverInvitation"("token");

-- CreateIndex
CREATE INDEX "HaulingPartnerDriverInvitation_haulingPartnerId_idx" ON "HaulingPartnerDriverInvitation"("haulingPartnerId");

-- CreateIndex
CREATE INDEX "HaulingPartnerDriverInvitation_email_idx" ON "HaulingPartnerDriverInvitation"("email");

-- CreateIndex
CREATE INDEX "HaulingPartnerAvailability_haulingPartnerId_dayOfWeek_idx" ON "HaulingPartnerAvailability"("haulingPartnerId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "OnfleetTask_haulJobId_idx" ON "OnfleetTask"("haulJobId");

-- CreateIndex
CREATE INDEX "Vehicle_haulingPartnerId_idx" ON "Vehicle"("haulingPartnerId");

-- AddForeignKey
ALTER TABLE "StorageUnitUsage" ADD CONSTRAINT "StorageUnitUsage_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnfleetTask" ADD CONSTRAINT "OnfleetTask_haulJobId_fkey" FOREIGN KEY ("haulJobId") REFERENCES "HaulJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_haulingPartnerId_fkey" FOREIGN KEY ("haulingPartnerId") REFERENCES "HaulingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulJob" ADD CONSTRAINT "HaulJob_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulJob" ADD CONSTRAINT "HaulJob_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulJob" ADD CONSTRAINT "HaulJob_haulingPartnerId_fkey" FOREIGN KEY ("haulingPartnerId") REFERENCES "HaulingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulJobUnit" ADD CONSTRAINT "HaulJobUnit_haulJobId_fkey" FOREIGN KEY ("haulJobId") REFERENCES "HaulJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulJobUnit" ADD CONSTRAINT "HaulJobUnit_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulingPartnerDriver" ADD CONSTRAINT "HaulingPartnerDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulingPartnerDriver" ADD CONSTRAINT "HaulingPartnerDriver_haulingPartnerId_fkey" FOREIGN KEY ("haulingPartnerId") REFERENCES "HaulingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulingPartnerDriverInvitation" ADD CONSTRAINT "HaulingPartnerDriverInvitation_haulingPartnerId_fkey" FOREIGN KEY ("haulingPartnerId") REFERENCES "HaulingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaulingPartnerAvailability" ADD CONSTRAINT "HaulingPartnerAvailability_haulingPartnerId_fkey" FOREIGN KEY ("haulingPartnerId") REFERENCES "HaulingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
