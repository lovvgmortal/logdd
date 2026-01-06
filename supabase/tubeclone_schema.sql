-- TubeClone Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- TubeClone Projects
CREATE TABLE IF NOT EXISTS tubeclone_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  source_url TEXT,
  niche TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  category_id TEXT,
  video_limit INT DEFAULT 50 CHECK (video_limit >= 50 AND video_limit <= 200),
  time_range TEXT DEFAULT '30d',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tubeclone_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON tubeclone_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON tubeclone_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON tubeclone_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON tubeclone_projects
  FOR DELETE USING (auth.uid() = user_id);

-- TubeClone Videos (found during research)
CREATE TABLE IF NOT EXISTS tubeclone_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES tubeclone_projects ON DELETE CASCADE NOT NULL,
  youtube_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  category_id TEXT,
  channel_id TEXT,
  channel_title TEXT,
  thumbnail_url TEXT,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  duration TEXT,
  published_at TIMESTAMPTZ,
  engagement_rate FLOAT,
  view_velocity FLOAT,
  combined_score FLOAT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tubeclone_videos ENABLE ROW LEVEL SECURITY;

-- RLS via project ownership
CREATE POLICY "Users can view own project videos" ON tubeclone_videos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own project videos" ON tubeclone_videos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own project videos" ON tubeclone_videos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own project videos" ON tubeclone_videos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

-- TubeClone Analyses
CREATE TABLE IF NOT EXISTS tubeclone_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES tubeclone_projects ON DELETE CASCADE NOT NULL,
  user_title TEXT,
  user_description TEXT,
  user_tags TEXT[],
  user_embedding VECTOR(1536),
  top_video_ids UUID[],
  pattern_analysis JSONB,
  scores JSONB,
  suggestions JSONB,
  validation_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tubeclone_analyses ENABLE ROW LEVEL SECURITY;

-- RLS via project ownership
CREATE POLICY "Users can view own analyses" ON tubeclone_analyses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own analyses" ON tubeclone_analyses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own analyses" ON tubeclone_analyses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own analyses" ON tubeclone_analyses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tubeclone_projects WHERE id = project_id AND user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tubeclone_projects_user ON tubeclone_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tubeclone_videos_project ON tubeclone_videos(project_id);
CREATE INDEX IF NOT EXISTS idx_tubeclone_analyses_project ON tubeclone_analyses(project_id);

-- Function to match embeddings (cosine similarity)
CREATE OR REPLACE FUNCTION match_tubeclone_videos(
  query_embedding VECTOR(1536),
  match_project_id UUID,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  youtube_id TEXT,
  title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.youtube_id,
    v.title,
    1 - (v.embedding <=> query_embedding) AS similarity
  FROM tubeclone_videos v
  WHERE v.project_id = match_project_id
    AND v.embedding IS NOT NULL
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


