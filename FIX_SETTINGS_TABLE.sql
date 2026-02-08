-- First, let's check what columns exist in the settings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings';

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'invalid_subscription_video'
    ) THEN
        ALTER TABLE settings 
        ADD COLUMN invalid_subscription_video TEXT DEFAULT 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    END IF;
END $$;

-- Add server_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'server_name'
    ) THEN
        ALTER TABLE settings 
        ADD COLUMN server_name TEXT DEFAULT 'IPTV Panel';
    END IF;
END $$;

-- Add server_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'server_url'
    ) THEN
        ALTER TABLE settings 
        ADD COLUMN server_url TEXT DEFAULT '';
    END IF;
END $$;

-- Update existing row with default values if columns were just added
UPDATE settings 
SET 
    invalid_subscription_video = COALESCE(invalid_subscription_video, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
    server_name = COALESCE(server_name, 'IPTV Panel'),
    server_url = COALESCE(server_url, '')
WHERE id = 1;

-- If no rows exist, insert default settings
INSERT INTO settings (invalid_subscription_video, server_name, server_url)
SELECT 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'IPTV Panel',
    ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Verify the final result
SELECT * FROM settings;
