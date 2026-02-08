-- STEP 1: First, let's see what the settings table looks like
SELECT * FROM settings LIMIT 5;

-- STEP 2: Add missing columns (safe - won't fail if columns already exist)
DO $$ 
BEGIN
    -- Add id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'id'
    ) THEN
        ALTER TABLE settings ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;

    -- Add invalid_subscription_video column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'invalid_subscription_video'
    ) THEN
        ALTER TABLE settings ADD COLUMN invalid_subscription_video TEXT DEFAULT 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    END IF;

    -- Add server_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'server_name'
    ) THEN
        ALTER TABLE settings ADD COLUMN server_name TEXT DEFAULT 'IPTV Panel';
    END IF;

    -- Add server_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'server_url'
    ) THEN
        ALTER TABLE settings ADD COLUMN server_url TEXT DEFAULT '';
    END IF;

    -- Add created_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE settings ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE settings ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- STEP 3: Insert a row if the table is empty
INSERT INTO settings (invalid_subscription_video, server_name, server_url)
SELECT 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'IPTV Panel',
    ''
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- STEP 4: Verify the result
SELECT * FROM settings;
