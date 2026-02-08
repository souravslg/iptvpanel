# 🚀 Deployment Update - DRM Fix

A critical fix for ClearKey DRM has been pushed to GitHub and is deploying to Vercel.

## 🔓 Fix: ClearKey DRM Decryption
- **Problem:** Many IPTV players (like OTT Navigator and Kodi) expect DRM keys in a specific "Base64URL" format, but users often provide them in "Hex" format. This mismatch caused the stream to fail even if the key was correct.
- **Solution:** The system now automatically detects Hex keys and converts them to the correct Base64URL format when generating the playlist.
- **Result:** Channels with ClearKey DRM should now play correctly without any manual changes from you.

## 🔍 How to Verify
1.  **Wait** 1-2 minutes for the deployment to finish.
2.  **Refresh Playlist:** Ask users to refresh their playlist in their app.
3.  **Test Channel:** Try playing a channel that uses ClearKey DRM.

**Commit:** `Fix ClearKey DRM hex-to-base64url conversion`
