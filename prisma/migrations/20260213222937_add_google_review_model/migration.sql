-- CreateTable
CREATE TABLE "GoogleReview" (
    "id" SERIAL NOT NULL,
    "customer" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "publishTime" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "googleMapsUrl" TEXT,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleReview_contentHash_key" ON "GoogleReview"("contentHash");

-- CreateIndex
CREATE INDEX "GoogleReview_rating_idx" ON "GoogleReview"("rating");
