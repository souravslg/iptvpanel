-- Add enabled column to streams table
-- This allows channels to be disabled without deleting them
-- Disabled channels won't appear in playlists or Xtream API

ALTER TABLE streams
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_streams_enabled ON streams(enabled);

-- Ensure all existing channels are enabled by default
UPDATE streams SET enabled = true WHERE enabled IS NULL;
