-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_CONFIRMED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_STARTED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'JOB_OFFER_RECEIVED', 'JOB_ASSIGNED', 'JOB_DETAILS_UPDATED', 'JOB_CANCELLED', 'RECONFIRMATION_REQUIRED', 'NEW_JOB_AVAILABLE', 'JOB_COMPLETED', 'CUSTOMER_CANCELLATION', 'ORDER_CONFIRMED', 'ORDER_BEING_PREPARED', 'DRIVER_EN_ROUTE', 'DELIVERY_COMPLETED', 'ORDER_CANCELLED', 'ROUTE_OFFER', 'ROUTE_ASSIGNED', 'ROUTE_CANCELLED', 'PAYMENT_FAILED', 'REFUND_PROCESSED', 'INVOICE_AVAILABLE', 'PAYOUT_PROCESSED', 'PAYOUT_FAILED', 'EARNINGS_SUMMARY', 'FEEDBACK_RECEIVED', 'TIP_RECEIVED', 'ACCOUNT_APPROVED', 'ACCOUNT_SUSPENDED', 'VEHICLE_APPROVED', 'VEHICLE_REJECTED', 'NEW_DRIVER_APPLICATION', 'DRIVER_APPROVED', 'TEAM_STATUS_UPDATE', 'SYSTEM_MAINTENANCE', 'NEW_FEATURE_ANNOUNCEMENT', 'POLICY_UPDATES', 'SECURITY_ALERT', 'STORAGE_ACCESS_REMINDER', 'STORAGE_PAYMENT_DUE', 'COMPLIANCE_ISSUE', 'PERFORMANCE_ALERT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('USER', 'DRIVER', 'MOVER', 'ADMIN');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "recipientType" "UserType" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "groupKey" TEXT,
    "groupCount" INTEGER DEFAULT 1,
    "appointmentId" INTEGER,
    "orderId" INTEGER,
    "routeId" TEXT,
    "taskId" TEXT,
    "driverId" INTEGER,
    "movingPartnerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "userType" "UserType" NOT NULL,
    "enableAppNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableEmailDigest" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_recipientType_status_idx" ON "Notification"("recipientId", "recipientType", "status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_groupKey_idx" ON "Notification"("groupKey");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "NotificationSettings_userId_userType_idx" ON "NotificationSettings"("userId", "userType");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PackingSupplyOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
