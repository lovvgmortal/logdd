-- ============================================================================
-- MIGRATION: Cleanup Duplicate Persona Fields
-- Date: 2026-01-08
-- Purpose: Xóa các field trùng lặp trong personas table
-- ============================================================================

-- BACKUP WARNING:
-- Trước khi chạy migration này, NÊN backup data nếu có personas trong database!
-- Các columns này sẽ bị XÓA VĨNH VIỄN cùng với data bên trong.

-- ============================================================================
-- BƯỚC 1: Xóa các columns trùng lặp 100%
-- ============================================================================

-- Xóa objections[] (trùng với objection_timeline[])
-- objection_timeline có thêm timing + counterTactic, nên giữ lại nó
ALTER TABLE public.personas
DROP COLUMN IF EXISTS objections;

-- Xóa demographics (trùng với age_range + knowledge_level)
-- age_range và knowledge_level đã đủ, không cần demographics object
ALTER TABLE public.personas
DROP COLUMN IF EXISTS demographics;

-- Xóa knowledge_profile (trùng với knowledge_level)
-- knowledge_level (string) đơn giản hơn và đủ dùng
ALTER TABLE public.personas
DROP COLUMN IF EXISTS knowledge_profile;

-- ============================================================================
-- BƯỚC 2: Xác nhận các columns còn lại
-- ============================================================================

-- Kiểm tra structure của personas table sau khi cleanup
-- Uncomment dòng dưới để xem danh sách columns còn lại:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'personas' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- ============================================================================
-- KẾT QUẢ MONG ĐỢI
-- ============================================================================
-- Personas table còn lại các fields:
-- ✅ id, user_id, created_at, updated_at
-- ✅ name, age_range, knowledge_level, pain_points
-- ✅ preferred_tone, vocabulary, niche
-- ✅ target_country, content_sources
-- ✅ content_consumption (attention span + formats)
-- ✅ trust_profile (primary/secondary + reasoning)
-- ✅ objection_timeline (with timing + counter tactics)
-- ✅ action_barriers
--
-- ❌ objections (DELETED - trùng với objection_timeline)
-- ❌ demographics (DELETED - trùng với age_range + knowledge_level)
-- ❌ knowledge_profile (DELETED - trùng với knowledge_level)

-- DONE! Chạy script này trong Supabase SQL Editor
