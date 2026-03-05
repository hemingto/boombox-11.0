-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "aiPrompt" TEXT,
ADD COLUMN     "generatedByAI" BOOLEAN NOT NULL DEFAULT false;
