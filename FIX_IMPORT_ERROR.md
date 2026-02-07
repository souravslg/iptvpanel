# Fix: "No active playlist found" Import Error

## Problem
When trying to import an M3U playlist, you're getting the error "No active playlist found". This is because the `playlists` table hasn't been created in your Supabase database yet.

## Solution

### Step 1: Access Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `utfblxhfyoebonlgtbwz`
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration
Copy and paste the following SQL into the SQL Editor and click "Run":

```sql
-- Add support for multiple playlists

-- Create playlists table to store multiple playlist configurations
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    source_url TEXT,
    total_channels INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add playlist_id to streams table to associate streams with playlists
ALTER TABLE streams ADD COLUMN IF NOT EXISTS playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_streams_playlist_id ON streams(playlist_id);

-- Create a default playlist and migrate existing streams
INSERT INTO playlists (name, description, is_active, total_channels)
VALUES ('Default Playlist', 'Main playlist', true, (SELECT COUNT(*) FROM streams WHERE playlist_id IS NULL))
ON CONFLICT (name) DO NOTHING;

-- Associate existing streams with the default playlist
UPDATE streams 
SET playlist_id = (SELECT id FROM playlists WHERE name = 'Default Playlist')
WHERE playlist_id IS NULL;

-- Add trigger to update playlist total_channels count
CREATE OR REPLACE FUNCTION update_playlist_channel_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists SET total_channels = total_channels + 1, updated_at = CURRENT_TIMESTAMP WHERE id = NEW.playlist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists SET total_channels = total_channels - 1, updated_at = CURRENT_TIMESTAMP WHERE id = OLD.playlist_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.playlist_id != OLD.playlist_id THEN
        UPDATE playlists SET total_channels = total_channels - 1, updated_at = CURRENT_TIMESTAMP WHERE id = OLD.playlist_id;
        UPDATE playlists SET total_channels = total_channels + 1, updated_at = CURRENT_TIMESTAMP WHERE id = NEW.playlist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_playlist_count
AFTER INSERT OR DELETE OR UPDATE ON streams
FOR EACH ROW
EXECUTE FUNCTION update_playlist_channel_count();

COMMENT ON TABLE playlists IS 'Stores multiple playlist configurations';
COMMENT ON COLUMN playlists.is_active IS 'Indicates which playlist is currently active';
COMMENT ON COLUMN playlists.source_url IS 'Original M3U URL if imported from URL';
```

### Step 3: Verify the Migration
After running the SQL, verify that the table was created:

1. In Supabase dashboard, go to "Table Editor"
2. You should see a new table called `playlists`
3. It should have one row: "Default Playlist" with `is_active = true`

### Step 4: Test the Import
1. Go back to your IPTV panel application
2. Refresh the page
3. Try importing an M3U playlist again
4. The error should be gone!

## What This Migration Does

1. **Creates the `playlists` table**: Stores multiple playlist configurations
2. **Adds `playlist_id` column to `streams`**: Associates each stream with a playlist
3. **Creates a default playlist**: Sets up an initial "Default Playlist" as active
4. **Migrates existing streams**: Links any existing streams to the default playlist
5. **Sets up automatic counting**: Adds a trigger to keep track of channel counts per playlist

## Alternative: Quick Fix via Code

If you can't access Supabase dashboard right now, I can modify the code to automatically create the table on first run. Let me know if you'd prefer this approach!
