-- Migration: Add model selection fields to scripts table
-- Allows persisting user's outline and script model choices per project

-- Add outline_model column
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS outline_model TEXT DEFAULT 'google/gemini-3-flash-preview';

-- Add script_model column  
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS script_model TEXT DEFAULT 'google/gemini-3-flash-preview';

-- Add comments for documentation
COMMENT ON COLUMN scripts.outline_model IS 'AI model used for outline generation';
COMMENT ON COLUMN scripts.script_model IS 'AI model used for script generation and rewriting';
