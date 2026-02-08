-- Diagnostic: Check if the failing stream IDs exist and in which playlists

-- Check if these streams exist at all
SELECT 
    s.id,
    s.stream_id,
    s.name,
    s.playlist_id,
    p.name as playlist_name,
    p.is_active as playlist_active
FROM streams s
JOIN playlists p ON s.playlist_id = p.id
WHERE s.stream_id IN ('1790', '661', '464', '808')
   OR s.id IN (1790, 661, 464, 808)
ORDER BY s.stream_id;

-- Check active playlists
SELECT id, name, is_active, total_channels 
FROM playlists 
WHERE is_active = true;

-- Count streams in each playlist
SELECT 
    p.id,
    p.name,
    p.is_active,
    COUNT(s.id) as stream_count
FROM playlists p
LEFT JOIN streams s ON s.playlist_id = p.id
GROUP BY p.id, p.name, p.is_active
ORDER BY p.is_active DESC, p.name;
