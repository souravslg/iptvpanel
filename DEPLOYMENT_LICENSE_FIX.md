# 🚀 Deployment Update - License Header Fix

A fix for "Incorrect Key Error" on DRM streams has been pushed to GitHub and is deploying to Vercel.

## 🔗 The Problem
- When a channel uses Widevine DRM (like Zee5), the player needs to fetch a license key from a server.
- This license server often *requires* specific headers (like `User-Agent` or `Referer`) to prove the request is valid.
- If the player sends the request *without* these headers, the license server rejects it, and the player shows "Incorrect Key Error".

## ✅ The Fix
- The system now **appends the headers to the License URL** in the playlist file (M3U).
- We use the pipe syntax (`|User-Agent=...`) which tells players like Kodi and OTT Navigator to send these headers along with the license request.

## 🔄 Verification
1.  **Wait 1-2 minutes** for the deployment to finish.
2.  **Refresh Playlist:** This is CRITICAL. The user **MUST refresh their playlist** in the app to get the new instructions.
3.  **Retry Playback:** Try playing the channel again.

**Commit:** `Fix Widevine license URL: Append headers for player compatibility`
