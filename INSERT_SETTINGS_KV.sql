-- Insert the invalid subscription video URL as a key-value pair
INSERT INTO settings (key, value)
VALUES ('invalid_subscription_video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- Insert server name
INSERT INTO settings (key, value)
VALUES ('server_name', 'IPTV Panel')
ON CONFLICT (key) DO NOTHING;

-- Insert server URL
INSERT INTO settings (key, value)
VALUES ('server_url', '')
ON CONFLICT (key) DO NOTHING;

-- Verify the settings were added
SELECT * FROM settings WHERE key IN ('invalid_subscription_video', 'server_name', 'server_url');
