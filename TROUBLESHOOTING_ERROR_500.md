# Fixing "Error 500 - Stream Not Reachable"

## Common Causes & Solutions

### Cause 1: Empty or Missing Stream URLs ⚠️ MOST COMMON

**Problem:** Streams in database don't have valid URLs

**Check:**
```sql
-- See which streams have empty URLs
SELECT id, stream_id, name, url, 
       CASE 
           WHEN url IS NULL THEN '❌ NULL'
           WHEN url = '' THEN '❌ EMPTY'
           ELSE '✅ HAS URL'
       END as url_status
FROM streams
ORDER BY url_status;
```

**Fix:**
```sql
-- Update streams with valid URLs
UPDATE streams 
SET url = 'http://example.com/stream.m3u8'
WHERE id = 1;  -- Replace with your stream ID

-- Or bulk update all streams
UPDATE streams 
SET url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'  -- Sample HLS stream
WHERE url IS NULL OR url = '';
```

---

### Cause 2: Invalid Stream URLs

**Problem:** Stream URLs are malformed or unreachable

**Check:**
```sql
-- List all stream URLs
SELECT id, name, url 
FROM streams 
LIMIT 10;
```

**Valid URL formats:**
- ✅ `http://example.com/stream.m3u8` (HLS)
- ✅ `http://example.com/stream.ts` (MPEG-TS)
- ✅ `rtmp://example.com/live/stream` (RTMP)
- ❌ `stream.m3u8` (missing protocol)
- ❌ `//example.com/stream` (missing protocol)

**Fix:**
```sql
-- Fix URLs missing http://
UPDATE streams 
SET url = 'http://' || url 
WHERE url NOT LIKE 'http%' AND url NOT LIKE 'rtmp%';
```

---

### Cause 3: Database Connection Issues

**Problem:** Supabase connection failing

**Check Vercel Logs:**
1. Go to Vercel Dashboard
2. Click "Logs"
3. Look for errors like:
   - `connection refused`
   - `timeout`
   - `ECONNREFUSED`

**Fix:**
- Check Supabase is online
- Verify environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Cause 4: Stream Not Found in Database

**Problem:** Stream ID doesn't exist

**Check:**
```sql
-- Check if stream exists
SELECT * FROM streams 
WHERE id = 1 OR stream_id = '1';
```

**Fix:**
```sql
-- Add missing stream
INSERT INTO streams (stream_id, name, url, category)
VALUES ('1', 'Test Channel', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'Test');
```

---

## Quick Diagnostic Steps

### Step 1: Check Vercel Logs

After getting error 500, check logs for:

```
Stream proxy error: {
  message: "...",
  username: "ufpr6xw8",
  streamId: "1"
}
```

Common error messages:
- `"Stream URL is empty"` → Stream has no URL in database
- `"Invalid URL"` → Stream URL is malformed
- `"Stream not found"` → Stream doesn't exist (404, not 500)
- `"Cannot read property 'url'"` → Database query failed

---

### Step 2: Test Stream URL Directly

Copy a stream URL from database and test in VLC:

```sql
SELECT url FROM streams WHERE id = 1;
```

1. Copy the URL
2. Open VLC
3. Media → Open Network Stream
4. Paste URL
5. Click Play

**If VLC can't play it:** The stream URL itself is invalid
**If VLC plays it:** The issue is with your panel code

---

### Step 3: Check Database Data

```sql
-- Get complete stream info
SELECT 
    id,
    stream_id,
    name,
    url,
    LENGTH(url) as url_length,
    CASE 
        WHEN url IS NULL THEN '❌ NULL'
        WHEN url = '' THEN '❌ EMPTY'
        WHEN url LIKE 'http%' THEN '✅ VALID FORMAT'
        ELSE '⚠️ SUSPICIOUS'
    END as status
FROM streams
LIMIT 20;
```

---

## Test Stream URLs

Use these free test streams to verify your panel works:

```sql
-- Insert test streams
INSERT INTO streams (stream_id, name, url, category, logo) VALUES
('test1', 'Big Buck Bunny', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'Test', ''),
('test2', 'Sintel', 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', 'Test', ''),
('test3', 'Tears of Steel', 'https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8', 'Test', '');
```

Then test:
```
https://your-panel.vercel.app/live/ufpr6xw8/xblxgafray/test1.ts
```

---

## Most Likely Solution

Based on "Error 500 - Stream not reachable", the issue is probably:

**Empty stream URLs in database**

**Quick Fix:**
```sql
-- Check how many streams have empty URLs
SELECT COUNT(*) as empty_url_count
FROM streams
WHERE url IS NULL OR url = '';

-- If you see a number > 0, you need to add URLs
-- Option 1: Add test URLs to all empty streams
UPDATE streams 
SET url = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
WHERE url IS NULL OR url = '';

-- Option 2: Delete streams without URLs
DELETE FROM streams 
WHERE url IS NULL OR url = '';
```

---

## After Fixing

1. **Deploy the new code** (with better error logging)
2. **Check Vercel logs** to see exact error message
3. **Fix the root cause** based on error message
4. **Test again**

---

## Need Help?

Share the error message from Vercel logs:
```
Stream proxy error: {
  message: "...",  ← Share this
  username: "...",
  streamId: "..."
}
```

This will help identify the exact issue!
