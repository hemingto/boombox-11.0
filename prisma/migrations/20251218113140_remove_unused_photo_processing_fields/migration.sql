-- Drop unused photo processing columns and index from OnfleetTask
-- These fields were part of an abandoned cron-based photo processing architecture
-- that was replaced with webhook-based processing

-- Drop the index first
DROP INDEX IF EXISTS "OnfleetTask_needsPhotoProcessing_idx";

-- Drop the columns
ALTER TABLE "OnfleetTask" DROP COLUMN IF EXISTS "needsPhotoProcessing";
ALTER TABLE "OnfleetTask" DROP COLUMN IF EXISTS "photoProcessingAttempts";

