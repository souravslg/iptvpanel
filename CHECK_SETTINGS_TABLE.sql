-- Step 1: Check what columns currently exist in settings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings'
ORDER BY ordinal_position;
