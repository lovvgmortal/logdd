-- Fix missing columns in 'scripts' table
-- Run this script in the Supabase SQL Editor to resolve the "Could not find column" errors.

-- Add key_points (TEXT)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS key_points TEXT;

-- Add unique_angle (TEXT)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS unique_angle TEXT;

-- Add blueprint_content (JSONB)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS blueprint_content JSONB;

-- Add blueprint_id (UUID)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS blueprint_id UUID REFERENCES public.blueprints(id);

-- Add missing history columns (JSONB)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS outline_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS script_history JSONB DEFAULT '[]'::jsonb;

-- Ensure other columns exist just in case
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS full_script TEXT;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS generation_mode TEXT;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id);
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS dna_id UUID REFERENCES public.dnas(id);

-- Force schema cache reload (optional but helpful)
NOTIFY pgrst, 'reload schema';
