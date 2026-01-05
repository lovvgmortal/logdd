-- ============================================================================
-- SUBSCRIPTION TIERS MIGRATION
-- Run this in Supabase SQL Editor
-- Date: 2026-01-05
-- ============================================================================

-- Step 1: Add subscription tier column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter'
CHECK (subscription_tier IN ('starter', 'pro', 'ultra'));

-- Step 2: Add subscription metadata columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Step 3: Create index for quick tier lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: starter (free), pro, ultra';
COMMENT ON COLUMN profiles.subscription_started_at IS 'When the current subscription started';
COMMENT ON COLUMN profiles.subscription_expires_at IS 'When the current subscription expires (null = lifetime or no subscription)';

-- ============================================================================
-- VERIFICATION QUERY (run after migration to verify)
-- ============================================================================
-- SELECT 
--   id, 
--   full_name, 
--   subscription_tier, 
--   subscription_started_at, 
--   subscription_expires_at 
-- FROM profiles 
-- LIMIT 5;

-- ============================================================================
-- ADMIN: Upgrade a user to Pro (example)
-- ============================================================================
-- UPDATE profiles 
-- SET 
--   subscription_tier = 'pro',
--   subscription_started_at = NOW(),
--   subscription_expires_at = NOW() + INTERVAL '1 month'
-- WHERE id = 'USER_UUID_HERE';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_started_at;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at;
