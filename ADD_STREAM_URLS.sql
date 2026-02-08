-- QUICK FIX: Add URLs to your streams

-- Step 1: Check current streams
SELECT id, stream_id, name, url,
       CASE 
           WHEN url IS NULL THEN '❌ NULL'
           WHEN url = '' THEN '❌ EMPTY'
           WHEN url LIKE 'http%' THEN '✅ HAS URL'
           ELSE '⚠️ INVALID'
       END as status
FROM streams
ORDER BY id
LIMIT 20;

-- Step 2: Count how many streams need URLs
SELECT 
    COUNT(*) as total_streams,
    COUNT(CASE WHEN url IS NULL OR url = '' THEN 1 END) as empty_urls,
    COUNT(CASE WHEN url IS NOT NULL AND url != '' THEN 1 END) as has_urls
FROM streams;

-- Step 3: Add test URLs to streams without URLs
-- Option A: Add a working test stream URL to all empty streams
UPDATE streams 
SET url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
WHERE url IS NULL OR url = '';

-- Option B: Add different test streams
UPDATE streams 
SET url = CASE 
    WHEN MOD(id, 3) = 0 THEN 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    WHEN MOD(id, 3) = 1 THEN 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
    ELSE 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8'
END
WHERE url IS NULL OR url = '';

-- Step 4: Verify the update
SELECT id, stream_id, name, url
FROM streams
WHERE url IS NOT NULL AND url != ''
LIMIT 10;

-- Step 5: If you want to add your own stream URLs
-- Replace these with your actual stream URLs:
/*
UPDATE streams SET url = 'http://your-server.com/stream1.m3u8' WHERE id = 1;
UPDATE streams SET url = 'http://your-server.com/stream2.m3u8' WHERE id = 2;
UPDATE streams SET url = 'http://your-server.com/stream3.m3u8' WHERE id = 3;
*/
