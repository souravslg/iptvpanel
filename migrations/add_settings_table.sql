-- Create settings table for IPTV panel configuration
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    invalid_subscription_video TEXT DEFAULT 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    server_name TEXT DEFAULT 'IPTV Panel',
    server_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (invalid_subscription_video, server_name, server_url)
VALUES (
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'IPTV Panel',
    ''
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE settings IS 'Global settings for the IPTV panel';
COMMENT ON COLUMN settings.invalid_subscription_video IS 'Video URL shown to users with expired/inactive subscriptions';
