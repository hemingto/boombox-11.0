-- CreateEnum
CREATE TYPE "MovingPartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "verifiedPhoneNumber" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "jobCode" TEXT,
    "userId" INTEGER NOT NULL,
    "movingPartnerId" INTEGER,
    "thirdPartyMovingPartnerId" INTEGER,
    "appointmentType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "numberOfUnits" INTEGER,
    "planType" TEXT,
    "insuranceCoverage" TEXT,
    "loadingHelpPrice" DOUBLE PRECISION,
    "monthlyStorageRate" DOUBLE PRECISION,
    "monthlyInsuranceRate" DOUBLE PRECISION,
    "quotedPrice" DOUBLE PRECISION NOT NULL,
    "invoiceTotal" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "deliveryReason" TEXT,
    "totalEstimatedCost" DOUBLE PRECISION,
    "totalActualCost" DOUBLE PRECISION,
    "costLastUpdatedAt" TIMESTAMP(3),
    "trackingToken" TEXT,
    "trackingUrl" TEXT,
    "invoiceUrl" TEXT,
    "serviceStartTime" TEXT,
    "serviceEndTime" TEXT,
    "calledMovingPartner" BOOLEAN NOT NULL DEFAULT false,
    "gotHoldOfMovingPartner" BOOLEAN,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalAppointmentInfo" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "itemsOver100lbs" BOOLEAN NOT NULL,
    "storageTerm" TEXT,
    "storageAccessFrequency" TEXT,
    "moveDescription" TEXT,
    "conditionsDescription" TEXT,

    CONSTRAINT "AdditionalAppointmentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentCancellation" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "cancellationFee" DOUBLE PRECISION NOT NULL,
    "cancellationReason" TEXT NOT NULL,
    "cancellationDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovingPartner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phoneNumber" TEXT,
    "verifiedPhoneNumber" BOOLEAN DEFAULT false,
    "email" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "website" TEXT,
    "featured" TEXT,
    "imageSrc" TEXT,
    "onfleetTeamId" TEXT,
    "isApproved" BOOLEAN DEFAULT false,
    "numberOfEmployees" TEXT,
    "applicationComplete" BOOLEAN DEFAULT false,
    "status" "MovingPartnerStatus" NOT NULL DEFAULT 'INACTIVE',
    "stripeConnectAccountId" TEXT,
    "stripeConnectOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTermsAt" TIMESTAMP(3),

    CONSTRAINT "MovingPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovingPartnerAvailability" (
    "id" SERIAL NOT NULL,
    "movingPartnerId" INTEGER NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "MovingPartnerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlotBooking" (
    "id" SERIAL NOT NULL,
    "movingPartnerAvailabilityId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlotBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUnit" (
    "id" SERIAL NOT NULL,
    "storageUnitNumber" TEXT NOT NULL,
    "barcode" TEXT,
    "status" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "cleaningPhotos" TEXT[],
    "lastCleanedAt" TIMESTAMP(3),

    CONSTRAINT "StorageUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUnitUsage" (
    "id" SERIAL NOT NULL,
    "storageUnitId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "startAppointmentId" INTEGER,
    "endAppointmentId" INTEGER,
    "warehouseLocation" TEXT,
    "warehouseName" TEXT,
    "usageStartDate" TIMESTAMP(3) NOT NULL,
    "usageEndDate" TIMESTAMP(3),
    "mainImage" TEXT,
    "uploadedImages" TEXT[],
    "unitPickupPhotos" TEXT[],
    "description" TEXT,
    "padlockCombo" TEXT,

    CONSTRAINT "StorageUnitUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingKit" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "detailedDescription" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,

    CONSTRAINT "PackingKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detailedDescription" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "packingKitId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "stockCount" INTEGER NOT NULL,
    "isOutOfStock" BOOLEAN NOT NULL,
    "restockDate" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingSupplyOrder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "deliveryAddress" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT DEFAULT 'pending',
    "stripePaymentIntentId" TEXT,
    "onfleetTaskId" TEXT,
    "onfleetTaskShortId" TEXT,
    "assignedDriverId" INTEGER,
    "deliveryWindowStart" TIMESTAMP(3),
    "deliveryWindowEnd" TIMESTAMP(3),
    "actualDeliveryTime" TIMESTAMP(3),
    "deliveryPhotoUrl" TEXT,
    "driverPayoutAmount" DECIMAL(65,30),
    "driverPayoutStatus" TEXT DEFAULT 'pending',
    "routeMetrics" JSONB,
    "routeId" TEXT,
    "routePayoutTotal" DECIMAL(65,30),
    "routeStopNumber" INTEGER,
    "trackingToken" TEXT,
    "trackingUrl" TEXT,
    "batchProcessedAt" TIMESTAMP(3),
    "optimizationJobId" TEXT,

    CONSTRAINT "PackingSupplyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingSupplyRoute" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "totalStops" INTEGER NOT NULL,
    "completedStops" INTEGER NOT NULL DEFAULT 0,
    "routeStatus" TEXT NOT NULL DEFAULT 'in_progress',
    "totalDistance" DECIMAL(65,30),
    "totalTime" INTEGER,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "payoutAmount" DECIMAL(65,30),
    "payoutStatus" TEXT NOT NULL DEFAULT 'pending',
    "payoutTransferId" TEXT,
    "payoutProcessedAt" TIMESTAMP(3),
    "payoutFailureReason" TEXT,
    "onfleetOptimizationId" TEXT,
    "driverOfferSentAt" TIMESTAMP(3),
    "driverOfferExpiresAt" TIMESTAMP(3),
    "driverOfferStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingSupplyRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingSupplyOrderDetails" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PackingSupplyOrderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyMovingPartner" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageSrc" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviews" TEXT NOT NULL,
    "weblink" TEXT,
    "gmblink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartyMovingPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnfleetTask" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "taskId" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "unitNumber" INTEGER NOT NULL,
    "webhookTime" TEXT,
    "driverId" INTEGER,
    "storageUnitId" INTEGER,
    "driverVerified" BOOLEAN NOT NULL DEFAULT false,
    "driverFeedback" TEXT,
    "completionPhotoUrl" TEXT,
    "needsPhotoProcessing" BOOLEAN NOT NULL DEFAULT false,
    "photoProcessingAttempts" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastNotifiedDriverId" INTEGER,
    "driverNotificationSentAt" TIMESTAMP(3),
    "driverNotificationStatus" TEXT,
    "driverAcceptedAt" TIMESTAMP(3),
    "driverDeclinedAt" TIMESTAMP(3),
    "declinedDriverIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "costCalculatedAt" TIMESTAMP(3),
    "workerType" TEXT,
    "estimatedServiceHours" DOUBLE PRECISION,
    "actualServiceHours" DOUBLE PRECISION,
    "estimatedDistanceMiles" DOUBLE PRECISION,
    "payoutAmount" DOUBLE PRECISION,
    "payoutStatus" TEXT,
    "payoutTransferId" TEXT,
    "payoutProcessedAt" TIMESTAMP(3),
    "payoutFailureReason" TEXT,
    "payoutRetryCount" INTEGER NOT NULL DEFAULT 0,
    "payoutLastAttemptAt" TIMESTAMP(3),

    CONSTRAINT "OnfleetTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "movingPartnerId" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipPaymentIntentId" TEXT,
    "tipPaymentStatus" TEXT,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestedAccessStorageUnit" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "storageUnitId" INTEGER NOT NULL,
    "unitsReady" BOOLEAN NOT NULL DEFAULT false,
    "requestedUnitPickupPhotos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestedAccessStorageUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "verifiedPhoneNumber" BOOLEAN DEFAULT false,
    "phoneProvider" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "services" TEXT[],
    "vehicleType" TEXT NOT NULL,
    "hasTrailerHitch" BOOLEAN NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "applicationComplete" BOOLEAN DEFAULT false,
    "onfleetWorkerId" TEXT,
    "onfleetTeamIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "driverLicenseFrontPhoto" TEXT,
    "driverLicenseBackPhoto" TEXT,
    "profilePicture" TEXT,
    "consentToBackgroundCheck" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeConnectAccountId" TEXT,
    "stripeConnectOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTermsAt" TIMESTAMP(3),
    "completedPackingSupplyJobs" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "lastRatingUpdate" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "autoInsurancePhoto" TEXT,
    "hasTrailerHitch" BOOLEAN NOT NULL DEFAULT false,
    "frontVehiclePhoto" TEXT,
    "backVehiclePhoto" TEXT,
    "movingPartnerId" INTEGER,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAvailability" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverTimeSlotBooking" (
    "id" SERIAL NOT NULL,
    "driverAvailabilityId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverTimeSlotBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverCancellation" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "cancellationReason" TEXT NOT NULL,
    "cancellationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoverCancellation" (
    "id" SERIAL NOT NULL,
    "movingPartnerId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "cancellationReason" TEXT NOT NULL,
    "cancellationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoverCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovingPartnerDriver" (
    "id" SERIAL NOT NULL,
    "movingPartnerId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MovingPartnerDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverInvitation" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "movingPartnerId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "DriverInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" SERIAL NOT NULL,
    "contact" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userType" TEXT NOT NULL,
    "blockedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInvite" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUnitDamageReport" (
    "id" SERIAL NOT NULL,
    "storageUnitId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "damageDescription" TEXT NOT NULL,
    "damagePhotos" TEXT[],
    "actionTaken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,

    CONSTRAINT "StorageUnitDamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageUnitCleaning" (
    "id" SERIAL NOT NULL,
    "storageUnitId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "cleanedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photos" TEXT[],

    CONSTRAINT "StorageUnitCleaning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_jobCode_key" ON "Appointment"("jobCode");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_trackingToken_key" ON "Appointment"("trackingToken");

-- CreateIndex
CREATE UNIQUE INDEX "AdditionalAppointmentInfo_appointmentId_key" ON "AdditionalAppointmentInfo"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MovingPartner_phoneNumber_key" ON "MovingPartner"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MovingPartner_email_key" ON "MovingPartner"("email");

-- CreateIndex
CREATE INDEX "MovingPartnerAvailability_movingPartnerId_dayOfWeek_idx" ON "MovingPartnerAvailability"("movingPartnerId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlotBooking_appointmentId_key" ON "TimeSlotBooking"("appointmentId");

-- CreateIndex
CREATE INDEX "TimeSlotBooking_bookingDate_movingPartnerAvailabilityId_idx" ON "TimeSlotBooking"("bookingDate", "movingPartnerAvailabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageUnit_storageUnitNumber_key" ON "StorageUnit"("storageUnitNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StorageUnit_barcode_key" ON "StorageUnit"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "PackingSupplyOrder_trackingToken_key" ON "PackingSupplyOrder"("trackingToken");

-- CreateIndex
CREATE INDEX "PackingSupplyOrder_onfleetTaskId_idx" ON "PackingSupplyOrder"("onfleetTaskId");

-- CreateIndex
CREATE INDEX "PackingSupplyOrder_onfleetTaskShortId_idx" ON "PackingSupplyOrder"("onfleetTaskShortId");

-- CreateIndex
CREATE INDEX "PackingSupplyOrder_assignedDriverId_idx" ON "PackingSupplyOrder"("assignedDriverId");

-- CreateIndex
CREATE INDEX "PackingSupplyOrder_deliveryWindowStart_idx" ON "PackingSupplyOrder"("deliveryWindowStart");

-- CreateIndex
CREATE INDEX "PackingSupplyOrder_routeId_idx" ON "PackingSupplyOrder"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "PackingSupplyRoute_routeId_key" ON "PackingSupplyRoute"("routeId");

-- CreateIndex
CREATE INDEX "PackingSupplyRoute_driverId_idx" ON "PackingSupplyRoute"("driverId");

-- CreateIndex
CREATE INDEX "PackingSupplyRoute_deliveryDate_idx" ON "PackingSupplyRoute"("deliveryDate");

-- CreateIndex
CREATE INDEX "PackingSupplyRoute_routeStatus_idx" ON "PackingSupplyRoute"("routeStatus");

-- CreateIndex
CREATE INDEX "PackingSupplyRoute_payoutStatus_idx" ON "PackingSupplyRoute"("payoutStatus");

-- CreateIndex
CREATE UNIQUE INDEX "OnfleetTask_shortId_key" ON "OnfleetTask"("shortId");

-- CreateIndex
CREATE INDEX "OnfleetTask_taskId_idx" ON "OnfleetTask"("taskId");

-- CreateIndex
CREATE INDEX "OnfleetTask_appointmentId_idx" ON "OnfleetTask"("appointmentId");

-- CreateIndex
CREATE INDEX "OnfleetTask_driverId_idx" ON "OnfleetTask"("driverId");

-- CreateIndex
CREATE INDEX "OnfleetTask_storageUnitId_idx" ON "OnfleetTask"("storageUnitId");

-- CreateIndex
CREATE INDEX "OnfleetTask_needsPhotoProcessing_idx" ON "OnfleetTask"("needsPhotoProcessing");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_appointmentId_key" ON "Feedback"("appointmentId");

-- CreateIndex
CREATE INDEX "Feedback_movingPartnerId_idx" ON "Feedback"("movingPartnerId");

-- CreateIndex
CREATE INDEX "RequestedAccessStorageUnit_appointmentId_idx" ON "RequestedAccessStorageUnit"("appointmentId");

-- CreateIndex
CREATE INDEX "RequestedAccessStorageUnit_storageUnitId_idx" ON "RequestedAccessStorageUnit"("storageUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestedAccessStorageUnit_appointmentId_storageUnitId_key" ON "RequestedAccessStorageUnit"("appointmentId", "storageUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_email_key" ON "Driver"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phoneNumber_key" ON "Driver"("phoneNumber");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_movingPartnerId_idx" ON "Vehicle"("movingPartnerId");

-- CreateIndex
CREATE INDEX "DriverAvailability_driverId_idx" ON "DriverAvailability"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverTimeSlotBooking_appointmentId_key" ON "DriverTimeSlotBooking"("appointmentId");

-- CreateIndex
CREATE INDEX "DriverTimeSlotBooking_bookingDate_driverAvailabilityId_idx" ON "DriverTimeSlotBooking"("bookingDate", "driverAvailabilityId");

-- CreateIndex
CREATE INDEX "DriverCancellation_driverId_idx" ON "DriverCancellation"("driverId");

-- CreateIndex
CREATE INDEX "DriverCancellation_appointmentId_idx" ON "DriverCancellation"("appointmentId");

-- CreateIndex
CREATE INDEX "MoverCancellation_movingPartnerId_idx" ON "MoverCancellation"("movingPartnerId");

-- CreateIndex
CREATE INDEX "MoverCancellation_appointmentId_idx" ON "MoverCancellation"("appointmentId");

-- CreateIndex
CREATE INDEX "MovingPartnerDriver_movingPartnerId_idx" ON "MovingPartnerDriver"("movingPartnerId");

-- CreateIndex
CREATE INDEX "MovingPartnerDriver_driverId_idx" ON "MovingPartnerDriver"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "MovingPartnerDriver_movingPartnerId_driverId_key" ON "MovingPartnerDriver"("movingPartnerId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverInvitation_token_key" ON "DriverInvitation"("token");

-- CreateIndex
CREATE INDEX "DriverInvitation_token_idx" ON "DriverInvitation"("token");

-- CreateIndex
CREATE INDEX "DriverInvitation_movingPartnerId_idx" ON "DriverInvitation"("movingPartnerId");

-- CreateIndex
CREATE INDEX "DriverInvitation_email_idx" ON "DriverInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_contact_key" ON "VerificationCode"("contact");

-- CreateIndex
CREATE INDEX "BlockedDate_userId_userType_idx" ON "BlockedDate"("userId", "userType");

-- CreateIndex
CREATE INDEX "BlockedDate_blockedDate_idx" ON "BlockedDate"("blockedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_phoneNumber_key" ON "Admin"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_token_key" ON "AdminInvite"("token");

-- CreateIndex
CREATE INDEX "StorageUnitDamageReport_storageUnitId_idx" ON "StorageUnitDamageReport"("storageUnitId");

-- CreateIndex
CREATE INDEX "StorageUnitDamageReport_appointmentId_idx" ON "StorageUnitDamageReport"("appointmentId");

-- CreateIndex
CREATE INDEX "StorageUnitDamageReport_adminId_idx" ON "StorageUnitDamageReport"("adminId");

-- CreateIndex
CREATE INDEX "StorageUnitDamageReport_reportDate_idx" ON "StorageUnitDamageReport"("reportDate");

-- CreateIndex
CREATE INDEX "StorageUnitCleaning_storageUnitId_idx" ON "StorageUnitCleaning"("storageUnitId");

-- CreateIndex
CREATE INDEX "StorageUnitCleaning_adminId_idx" ON "StorageUnitCleaning"("adminId");

-- CreateIndex
CREATE INDEX "StorageUnitCleaning_cleanedAt_idx" ON "StorageUnitCleaning"("cleanedAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_thirdPartyMovingPartnerId_fkey" FOREIGN KEY ("thirdPartyMovingPartnerId") REFERENCES "ThirdPartyMovingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalAppointmentInfo" ADD CONSTRAINT "AdditionalAppointmentInfo_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentCancellation" ADD CONSTRAINT "AppointmentCancellation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovingPartnerAvailability" ADD CONSTRAINT "MovingPartnerAvailability_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlotBooking" ADD CONSTRAINT "TimeSlotBooking_movingPartnerAvailabilityId_fkey" FOREIGN KEY ("movingPartnerAvailabilityId") REFERENCES "MovingPartnerAvailability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlotBooking" ADD CONSTRAINT "TimeSlotBooking_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitUsage" ADD CONSTRAINT "StorageUnitUsage_startAppointmentId_fkey" FOREIGN KEY ("startAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitUsage" ADD CONSTRAINT "StorageUnitUsage_endAppointmentId_fkey" FOREIGN KEY ("endAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitUsage" ADD CONSTRAINT "StorageUnitUsage_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitUsage" ADD CONSTRAINT "StorageUnitUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_packingKitId_fkey" FOREIGN KEY ("packingKitId") REFERENCES "PackingKit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrder" ADD CONSTRAINT "PackingSupplyOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrder" ADD CONSTRAINT "PackingSupplyOrder_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrder" ADD CONSTRAINT "PackingSupplyOrder_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "PackingSupplyRoute"("routeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyRoute" ADD CONSTRAINT "PackingSupplyRoute_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrderDetails" ADD CONSTRAINT "PackingSupplyOrderDetails_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PackingSupplyOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrderDetails" ADD CONSTRAINT "PackingSupplyOrderDetails_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnfleetTask" ADD CONSTRAINT "OnfleetTask_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnfleetTask" ADD CONSTRAINT "OnfleetTask_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnfleetTask" ADD CONSTRAINT "OnfleetTask_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedAccessStorageUnit" ADD CONSTRAINT "RequestedAccessStorageUnit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedAccessStorageUnit" ADD CONSTRAINT "RequestedAccessStorageUnit_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAvailability" ADD CONSTRAINT "DriverAvailability_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTimeSlotBooking" ADD CONSTRAINT "DriverTimeSlotBooking_driverAvailabilityId_fkey" FOREIGN KEY ("driverAvailabilityId") REFERENCES "DriverAvailability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverTimeSlotBooking" ADD CONSTRAINT "DriverTimeSlotBooking_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverCancellation" ADD CONSTRAINT "DriverCancellation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverCancellation" ADD CONSTRAINT "DriverCancellation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoverCancellation" ADD CONSTRAINT "MoverCancellation_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoverCancellation" ADD CONSTRAINT "MoverCancellation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovingPartnerDriver" ADD CONSTRAINT "MovingPartnerDriver_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovingPartnerDriver" ADD CONSTRAINT "MovingPartnerDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverInvitation" ADD CONSTRAINT "DriverInvitation_movingPartnerId_fkey" FOREIGN KEY ("movingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitDamageReport" ADD CONSTRAINT "StorageUnitDamageReport_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitDamageReport" ADD CONSTRAINT "StorageUnitDamageReport_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitDamageReport" ADD CONSTRAINT "StorageUnitDamageReport_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitCleaning" ADD CONSTRAINT "StorageUnitCleaning_storageUnitId_fkey" FOREIGN KEY ("storageUnitId") REFERENCES "StorageUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageUnitCleaning" ADD CONSTRAINT "StorageUnitCleaning_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
