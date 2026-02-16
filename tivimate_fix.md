# TiviMate Decoder Exception Fix

## Problem
- ✅ Works: localhost, Auth IPTV  
- ❌ Fails: TiviMate - "media codec video decoder exception"

## Root Cause
TiviMate's decoder doesn't handle pipe-delimited headers in DASH URLs correctly.

## Solution

### Option 1: Change TiviMate Player Settings
1. Open TiviMate → Settings → Playback
2. Change **Player** to "ExoPlayer" (not "System Player")
3. Enable **Hardware Decoding**
4. Clear app cache

### Option 2: Use Alternative M3U Format
TiviMate prefers:
- `#KODIPROP` tags for DRM (already included ✅)
- `#EXTVLCOPT` for headers (already included ✅)
- Remove pipe headers from URL (TiviMate reads from tags)

### Option 3: Test with Source M3U Directly
Try the source directly in TiviMate:
```
https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u
```

If source works but our export doesn't → format issue
If source also fails → TiviMate player settings issue

## Quick Test
Load the source M3U first to confirm TiviMate can play JioTV streams at all.
