-- Add winning_structure column to personas table for DNA Lab
-- Run this script in Supabase Studio -> SQL Editor

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS winning_structure JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN personas.winning_structure IS 'Array of DNA Structure Blocks (Timing, Tone, Pacing, etc.)';
