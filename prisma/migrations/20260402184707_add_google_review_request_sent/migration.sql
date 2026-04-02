-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "googleReviewRequestSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PackingSupplyFeedback" ADD COLUMN     "googleReviewRequestSent" BOOLEAN NOT NULL DEFAULT false;
