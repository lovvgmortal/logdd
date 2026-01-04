-- DNA Evolution Learning History Migration
-- This adds a learning_history column to track DNA evolution over time

-- Add learning_history column to dnas table
ALTER TABLE dnas ADD COLUMN IF NOT EXISTS learning_history JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN dnas.learning_history IS 'History of DNA evolution from learning new content. Format: [{ id, timestamp, input_type, transcript_preview, changes_made }]';

-- Learning history entry format:
-- {
--   "id": "uuid",
--   "timestamp": "ISO timestamp",
--   "input_type": "viral" | "flop" | "mixed",
--   "source_urls": ["optional urls"],
--   "transcript_preview": "first 200 chars of input...",
--   "changes_made": [
--     "Added 'X' to corePatterns",
--     "Merged 'Y' and 'Z'",
--     "Refined hookAngle",
--     ...
--   ]
-- }
