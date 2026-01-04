-- Add content_sources column to personas table to support multi-source persistent analysis
-- Run this script in Supabase Studio -> SQL Editor

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS content_sources JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN personas.content_sources IS 'Array of content sources (script, comments, url) used for analysis';
