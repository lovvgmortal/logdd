-- Add history columns to scripts table for version tracking
ALTER TABLE public.scripts 
ADD COLUMN outline_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN script_history jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.scripts.outline_history IS 'Array of previous outline versions with timestamp';
COMMENT ON COLUMN public.scripts.script_history IS 'Array of previous script versions with timestamp';