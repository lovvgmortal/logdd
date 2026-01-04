-- Add new columns for detailed persona analysis
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS motivations TEXT[],
ADD COLUMN IF NOT EXISTS objections TEXT[];

-- Comment on columns
COMMENT ON COLUMN personas.motivations IS 'What drives the audience to watch content';
COMMENT ON COLUMN personas.objections IS 'What prevents the audience from engaging or believing';
