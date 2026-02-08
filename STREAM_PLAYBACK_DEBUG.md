# Stream Playback Issue - Multiple Active Playlists

## Problem
When trying to play channels with multiple active playlists, getting 404 errors for streams.

## Root Cause
The stream URLs in the database are stored in Xtream API format:
```
/live/{username}/{password}/{streamId}.m3u8
```

These URLs require:
1. Valid username/password in the URL path
2. The `/live/` endpoint to look up streams only in active playlists

## Fixes Applied

### 1. Fixed `/live/` endpoint to search only in active playlists
**File**: `app/live/[username]/[password]/[streamId]/route.js`

- Now fetches active playlists first
- Only searches for streams within those active playlists
- Handles duplicate stream IDs across playlists (uses first match)
- Better error logging

### 2. Fixed playlist API to fetch all channels beyond 1000 limit  
**File**: `app/api/playlist/route.js`

- Uses batch fetching with `.range()` to get all channels
- Properly aggregates channels from multiple active playlists
- Shows correct total count (2103 instead of 1000)

## Current Status
✅ Multiple playlists feature working (showing 2103 channels from 2 playlists)
✅ `/live/` endpoint updated to search in active playlists only
❌ Player still showing 404 errors

## Next Steps to Debug

### Check if URLs have proper authentication:
The stream URLs need to be in format:
```
/live/{valid_username}/{valid_password}/{streamId}.m3u8
```

### Verify the URLs in database:
Run this query to check:
```sql
SELECT id, name, url FROM streams WHERE playlist_id IN (
  SELECT id FROM playlists WHERE is_active = true
) LIMIT 5;
```

### Possible Issues:
1. **Invalid credentials in URLs** - Username/password in the URL don't match any user
2. **Stream IDs don't exist** - The stream ID in the URL doesn't exist in active playlists
3. **URL format wrong** - URLs might be external URLs, not Xtream API format

## How to Test
1. Check browser Network tab for the actual `/live/` requests
2. Look at server logs for "Live stream request:" messages
3. Check if authentication is failing or stream lookup is failing
