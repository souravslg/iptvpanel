-- Check sample stream URLs from both playlists
SELECT 
    s.id,
    s.stream_id,
    s.name,
    s.url,
    s.playlist_id,
    p.name as playlist_name
FROM streams s
JOIN playlists p ON s.playlist_id = p.id
WHERE p.is_active = true
LIMIT 10;
