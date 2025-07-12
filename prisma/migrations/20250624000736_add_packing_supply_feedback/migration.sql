-- CreateTable
CREATE TABLE "PackingSupplyFeedback" (
    "id" SERIAL NOT NULL,
    "packingSupplyOrderId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "tipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipPaymentIntentId" TEXT,
    "tipPaymentStatus" TEXT,
    "driverRating" TEXT,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingSupplyFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackingSupplyFeedback_packingSupplyOrderId_key" ON "PackingSupplyFeedback"("packingSupplyOrderId");

-- CreateIndex
CREATE INDEX "PackingSupplyFeedback_packingSupplyOrderId_idx" ON "PackingSupplyFeedback"("packingSupplyOrderId");

-- AddForeignKey
ALTER TABLE "PackingSupplyFeedback" ADD CONSTRAINT "PackingSupplyFeedback_packingSupplyOrderId_fkey" FOREIGN KEY ("packingSupplyOrderId") REFERENCES "PackingSupplyOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
