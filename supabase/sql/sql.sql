-- ============================================================================
-- MIGRATION: Enhanced Persona Schema
-- Date: 2026-01-07
-- Purpose: Thêm các field mới cho trustTriggers, actionBarriers, objectionTimeline
-- ============================================================================

-- Thêm các cột mới vào bảng personas
ALTER TABLE public.personas
ADD COLUMN IF NOT EXISTS target_country TEXT,
ADD COLUMN IF NOT EXISTS content_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS knowledge_profile JSONB,
ADD COLUMN IF NOT EXISTS demographics JSONB,
ADD COLUMN IF NOT EXISTS content_consumption JSONB,
ADD COLUMN IF NOT EXISTS trust_profile JSONB,
ADD COLUMN IF NOT EXISTS objection_timeline JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS action_barriers TEXT[];

-- Tạo indexes để tối ưu query
CREATE INDEX IF NOT EXISTS idx_personas_user_knowledge ON public.personas(user_id, knowledge_level);
CREATE INDEX IF NOT EXISTS idx_personas_user_country ON public.personas(user_id, target_country);
CREATE INDEX IF NOT EXISTS idx_dnas_user_niche ON public.dnas(user_id, niche);

-- DONE! Chạy script này trong Supabase SQL Editor
