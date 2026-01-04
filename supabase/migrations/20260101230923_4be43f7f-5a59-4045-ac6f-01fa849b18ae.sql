-- Thêm analysis_data JSONB column để lưu extended DNA fields
ALTER TABLE public.dnas ADD COLUMN IF NOT EXISTS analysis_data JSONB;