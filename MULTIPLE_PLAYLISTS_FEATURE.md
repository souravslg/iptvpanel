# Multiple Active Playlists Feature

## Summary
Added the ability to activate multiple playlists simultaneously in the IPTV panel. Users can now have multiple playlists active at the same time, and all channels from active playlists will be aggregated and displayed together.

## Changes Made

### 1. Frontend UI (`app/(dashboard)/playlist/page.js`)
- **State Management**: Changed from single `activePlaylist` to `activePlaylists` array
- **Playlist Toggle Button**: Updated to show "Activate/Deactivate" button for ALL playlists (not just inactive ones)
  - Active playlists show a red "Deactivate" button
  - Inactive playlists show a green "Activate" button
- **Active Playlist Display**: Updated modal to show all active playlists with their channel counts
- **Data Fetching**: Updated to handle multiple active playlists from the API

### 2. Backend API (`app/api/playlist/route.js`)
- **GET Endpoint**: 
  - Now fetches ALL active playlists instead of just one
  - Aggregates channels from all active playlists
  - Calculates total channels across all active playlists
  - Aggregates categories/groups from all active playlists
  - Returns `activePlaylists` array (with backward compatibility via `activePlaylist`)
  
- **POST Endpoint**: 
  - Updated to get first active playlist from multiple active playlists
  - Maintains backward compatibility

### 3. Switch Endpoint (`app/api/playlists/switch/route.js`)
- Already supported toggling individual playlists (no changes needed)
- Comment on line 4 already indicated "allows multiple active playlists"

## How It Works

1. **Activating Playlists**: 
   - Click "Manage Playlists" button
   - Click "Activate" on any inactive playlist to add it to active playlists
   - Click "Deactivate" on any active playlist to remove it from active playlists
   - You can have multiple playlists active simultaneously

2. **Viewing Channels**:
   - All channels from ALL active playlists are displayed together
   - Total channel count shows the sum across all active playlists
   - Categories are aggregated from all active playlists

3. **Visual Indicators**:
   - Active playlists have blue border and background in the playlist list
   - Active playlists show "ACTIVE" badge
   - Modal header shows all currently active playlists with channel counts

## Benefits

- **Flexibility**: Users can combine channels from multiple playlists
- **Organization**: Keep different channel sources in separate playlists
- **Easy Management**: Toggle playlists on/off as needed
- **No Data Loss**: Deactivating a playlist doesn't delete it, just hides its channels

## Testing

To test the feature:
1. Create multiple playlists with different channel sources
2. Activate multiple playlists
3. Verify that channels from all active playlists appear in the channel list
4. Verify that the total channel count is correct
5. Deactivate a playlist and verify its channels are removed from the view
