-- First, let's see the current structure
SELECT * FROM settings;

-- Add the missing columns (the ALTER statements already worked)
-- Now we just need to insert/update with the correct key column

-- Check if a row exists, if not insert one with a key
INSERT INTO settings (key, invalid_subscription_video, server_name, server_url)
SELECT 
    'global_settings',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'IPTV Panel',
    ''
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'global_settings');

-- If a row already exists, update it
UPDATE settings 
SET 
    invalid_subscription_video = COALESCE(invalid_subscription_video, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
    server_name = COALESCE(server_name, 'IPTV Panel'),
    server_url = COALESCE(server_url, '')
WHERE key = 'global_settings';

-- Show the final result
SELECT * FROM settings;
