# 🚀 Deployment Update - URL Fix & Kodi/VLC Support

A fix for broken stream URLs (especially those with `|User-Agent`) has been pushed to GitHub and is deploying to Vercel.

## 🔗 The Problem
- Some illegal IPTV providers include headers (like `User-Agent`) directly in the stream URL using a pipe (`|`) character.
- Example: `http://server.com/live/stream.m3u8|User-Agent=Kodi`
- Our system was treating the entire string as the URL, which caused playback to fail because `|User-Agent=Kodi` isn't part of the valid internet address.

## ✅ The Fix
1.  **Smart Parsing:** The system now recognizes the `|` syntax and separates the real URL from the headers.
2.  **Header Storage:** Headers like `User-Agent` and `Referer` are stored safely in a separate database column.
3.  **Player Support:** When you generate your playlist, we now correctly tell players (Kodi, VLC, OTT Navigator) to use these headers.
    - Adds `#EXTVLCOPT` tags for VLC/general players.
    - Adds `#KODIPROP` tags specifically for Kodi.

## 🔄 Critical Step: Re-Import Required
Because the old URLs are already broken in your database, the fix **will not apply automatically** to existing channels. You MUST:
1.  Go to **Manage Playlists**.
2.  **Refresh** your playlist (if imported from URL) OR delete and **re-upload** the M3U file.
3.  This will force the system to process the URLs correctly with the new code.

**Commit:** `Fix URL handling: Support pipe syntax for headers and pass correct User-Agent to players`
