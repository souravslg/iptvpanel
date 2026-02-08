# Xtream Panel Active Playlist Fix

## Issue
The Xtream panel was not fetching playlists from the active playlist. It was returning all streams from the database regardless of which playlist they belonged to.

## Root Cause
The `/api/player_api/route.js` endpoint (Xtream API) was querying the `streams` table without filtering by `playlist_id`. This meant:
- All streams were returned, not just those from active playlists
- When users switched playlists, the Xtream panel would still show all channels
- The behavior was inconsistent with other endpoints like `/api/playlist` and `/api/get`

## Solution
Modified the Xtream API endpoint to:
1. **Fetch active playlists first** - Query the `playlists` table for all playlists where `is_active = true`
2. **Filter streams by playlist IDs** - Only fetch streams that belong to the active playlist(s)
3. **Handle large datasets** - Use batch pagination (1000 records at a time) to handle playlists with many channels
4. **Apply to all actions** - Both `get_live_streams` and `get_live_categories` actions now filter by active playlists

## Changes Made
**File:** `c:\Users\soura\Desktop\iptv panel\panel\app\api\player_api\route.js`

### Before:
```javascript
// Get all streams (remove default 1000 limit)
const { data: streams } = await supabase
    .from('streams')
    .select('*')
    .limit(10000); // Set high limit to get all channels
```

### After:
```javascript
// Get active playlists first
const { data: activePlaylists, error: playlistError } = await supabase
    .from('playlists')
    .select('id')
    .eq('is_active', true);

// Get all streams from active playlists (fetch in batches)
let allStreams = [];
let hasMore = true;
let offset = 0;
const batchSize = 1000;

while (hasMore) {
    const { data: batch, error: batchError } = await supabase
        .from('streams')
        .select('*')
        .in('playlist_id', playlistIds)
        .order('id', { ascending: true })
        .range(offset, offset + batchSize - 1);
    
    if (batch && batch.length > 0) {
        allStreams = allStreams.concat(batch);
        offset += batchSize;
        hasMore = batch.length === batchSize;
    } else {
        hasMore = false;
    }
}
```

## Testing
To verify the fix:
1. Ensure you have multiple playlists in your database
2. Set one playlist as active
3. Access the Xtream API endpoint: `/api/player_api?username=<user>&password=<pass>&action=get_live_streams`
4. Verify only streams from the active playlist are returned
5. Switch to a different playlist and verify the streams change accordingly

## Related Endpoints
These endpoints were already correctly filtering by active playlists:
- `/api/playlist/route.js` - Main playlist API
- `/api/get/route.js` - M3U playlist generation

## Impact
- ✅ Xtream panel now respects the active playlist setting
- ✅ Users can switch between playlists and see the correct channels
- ✅ Consistent behavior across all API endpoints
- ✅ Proper handling of large playlists (>1000 channels)
