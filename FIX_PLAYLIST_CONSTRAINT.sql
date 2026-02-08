-- Fix for Multiple Playlists: Remove UNIQUE constraint on stream_id
-- This allows the same stream_id to exist in different playlists

-- Step 1: Drop the existing UNIQUE constraint
ALTER TABLE streams DROP CONSTRAINT IF EXISTS streams_stream_id_key;

-- Step 2: Add a composite UNIQUE constraint on (playlist_id, stream_id)
-- This ensures stream_id is unique within each playlist, but can repeat across playlists
ALTER TABLE streams ADD CONSTRAINT streams_playlist_stream_unique 
    UNIQUE (playlist_id, stream_id);

-- Note: If you have existing duplicate stream_ids, you may need to clean them up first
-- You can run this query to find duplicates:
-- SELECT stream_id, COUNT(*) 
-- FROM streams 
-- WHERE stream_id IS NOT NULL 
-- GROUP BY stream_id 
-- HAVING COUNT(*) > 1;
