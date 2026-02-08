-- Simple fix: Just add the missing columns without touching the primary key

-- Add invalid_subscription_video column
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS invalid_subscription_video TEXT 
DEFAULT 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

-- Add server_name column
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS server_name TEXT 
DEFAULT 'IPTV Panel';

-- Add server_url column
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS server_url TEXT 
DEFAULT '';

-- Add created_at column
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP 
DEFAULT NOW();

-- Add updated_at column
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP 
DEFAULT NOW();

-- Insert a row if the table is empty
INSERT INTO settings (invalid_subscription_video, server_name, server_url)
SELECT 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'IPTV Panel',
    ''
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Show the final result
SELECT * FROM settings;
