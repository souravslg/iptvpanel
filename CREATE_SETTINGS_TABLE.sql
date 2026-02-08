/**
 * Run this script in your Supabase SQL Editor to create the settings table
 * 
 * Steps:
 * 1. Go to your Supabase project
 * 2. Click on "SQL Editor" in the left sidebar
 * 3. Click "New Query"
 * 4. Copy and paste this entire script
 * 5. Click "Run" or press Ctrl+Enter
 */

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    invalid_subscription_video TEXT DEFAULT 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    server_name TEXT DEFAULT 'IPTV Panel',
    server_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings (only if table is empty)
INSERT INTO settings (invalid_subscription_video, server_name, server_url)
SELECT 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'IPTV Panel',
    ''
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Add comment
COMMENT ON TABLE settings IS 'Global settings for the IPTV panel';
COMMENT ON COLUMN settings.invalid_subscription_video IS 'Video URL shown to users with expired/inactive subscriptions';

-- Verify the table was created
SELECT * FROM settings;
