-- CreateTable
CREATE TABLE "TipTransfer" (
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientDriverId" INTEGER,
    "recipientMovingPartnerId" INTEGER,
    "stripeConnectAccountId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TipTransfer_feedbackId_idx" ON "TipTransfer"("feedbackId");

-- CreateIndex
CREATE INDEX "TipTransfer_recipientDriverId_idx" ON "TipTransfer"("recipientDriverId");

-- CreateIndex
CREATE INDEX "TipTransfer_recipientMovingPartnerId_idx" ON "TipTransfer"("recipientMovingPartnerId");

-- AddForeignKey
ALTER TABLE "TipTransfer" ADD CONSTRAINT "TipTransfer_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipTransfer" ADD CONSTRAINT "TipTransfer_recipientDriverId_fkey" FOREIGN KEY ("recipientDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipTransfer" ADD CONSTRAINT "TipTransfer_recipientMovingPartnerId_fkey" FOREIGN KEY ("recipientMovingPartnerId") REFERENCES "MovingPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
