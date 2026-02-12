-- ============================================
-- MANUAL DATABASE MIGRATION
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Step 1: Add enabled column to streams table
ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_streams_enabled ON streams(enabled);

-- Step 3: Ensure all existing channels are enabled
UPDATE streams 
SET enabled = true 
WHERE enabled IS NULL;

-- ============================================
-- VERIFICATION QUERY (Run this after to verify)
-- ============================================
SELECT id, name, enabled 
FROM streams 
LIMIT 5;
