-- CreateTable
CREATE TABLE "PackingSupplyOrderCancellation" (
    "id" SERIAL NOT NULL,
    "packingSupplyOrderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "cancellationReason" TEXT NOT NULL,
    "cancellationFee" DOUBLE PRECISION,
    "cancellationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundAmount" DOUBLE PRECISION,
    "refundStatus" TEXT DEFAULT 'pending',
    "adminNotes" TEXT,

    CONSTRAINT "PackingSupplyOrderCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackingSupplyOrderCancellation_packingSupplyOrderId_idx" ON "PackingSupplyOrderCancellation"("packingSupplyOrderId");

-- CreateIndex
CREATE INDEX "PackingSupplyOrderCancellation_userId_idx" ON "PackingSupplyOrderCancellation"("userId");

-- CreateIndex
CREATE INDEX "PackingSupplyOrderCancellation_cancellationDate_idx" ON "PackingSupplyOrderCancellation"("cancellationDate");

-- AddForeignKey
ALTER TABLE "PackingSupplyOrderCancellation" ADD CONSTRAINT "PackingSupplyOrderCancellation_packingSupplyOrderId_fkey" FOREIGN KEY ("packingSupplyOrderId") REFERENCES "PackingSupplyOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingSupplyOrderCancellation" ADD CONSTRAINT "PackingSupplyOrderCancellation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
