-- Step 1: Check what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'settings'
ORDER BY ordinal_position;
