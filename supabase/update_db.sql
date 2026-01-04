-- Add detailed analysis column (JSONB)
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS analysis_data JSONB;

-- Add missing text columns
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS source_transcript TEXT;

-- Add missing array columns
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS retention_tactics TEXT[];
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS x_factors TEXT[];

-- Add history columns to Scripts table (if not already present)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS outline_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS script_history jsonb DEFAULT '[]'::jsonb;

-- Add blueprint_content column to Scripts table (missing column causing save error)
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS blueprint_content JSONB;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS blueprint_id UUID REFERENCES public.blueprints(id);

-- Add documentation comments
COMMENT ON COLUMN public.scripts.outline_history IS 'Array of previous outline versions with timestamp';
COMMENT ON COLUMN public.scripts.script_history IS 'Array of previous script versions with timestamp';
COMMENT ON COLUMN public.scripts.blueprint_content IS 'Stores the structure/blueprint data used for this script';
