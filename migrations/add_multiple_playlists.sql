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
