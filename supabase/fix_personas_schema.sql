-- Comprehensive fix for Personas table schema
-- Run this script in Supabase Studio -> SQL Editor

-- 1. Create table if it doesn't exist (Basic structure)
CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add potentially missing columns safely
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS knowledge_level TEXT,
ADD COLUMN IF NOT EXISTS pain_points TEXT[],
ADD COLUMN IF NOT EXISTS preferred_tone TEXT,
ADD COLUMN IF NOT EXISTS vocabulary TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add the NEW columns for Upgrade (in case previous script failed or wasn't run)
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS motivations TEXT[],
ADD COLUMN IF NOT EXISTS objections TEXT[];

-- 4. Enable Row Level Security (RLS) if not already enabled
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies (Drop existing to avoid conflicts, then recreate)
DROP POLICY IF EXISTS "Users can view their own personas" ON personas;
DROP POLICY IF EXISTS "Users can create their own personas" ON personas;
DROP POLICY IF EXISTS "Users can update their own personas" ON personas;
DROP POLICY IF EXISTS "Users can delete their own personas" ON personas;

CREATE POLICY "Users can view their own personas" 
ON personas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personas" 
ON personas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas" 
ON personas FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas" 
ON personas FOR DELETE 
USING (auth.uid() = user_id);
