-- Fix embedding dimensions: Change from 1536 to 3072 to match text-embedding-3-large model

-- 1. Alter user_embedding column in tubeclone_analyses
ALTER TABLE tubeclone_analyses 
ALTER COLUMN user_embedding TYPE VECTOR(3072);

-- 2. If video embeddings column also needs update
ALTER TABLE tubeclone_videos 
ALTER COLUMN embedding TYPE VECTOR(3072);
