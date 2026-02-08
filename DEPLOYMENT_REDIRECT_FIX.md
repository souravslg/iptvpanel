# 🚀 Deployment Update - Redirect Header Fix

A fix for browser vs. OTT Navigator playback discrepancies has been pushed to GitHub and is deploying to Vercel.

## 🔗 The Problem
- Some streams have specific `User-Agent` or `Referer` requirements.
- While the browser handled these correctly, some external players like **OTT Navigator** or **TiviMate** would ignore these headers when following a redirect from your panel to the final stream URL.
- This caused the stream to play in a browser but fail in the app.

## ✅ The Fix
- The system now **appends the headers back to the final redirect URL** using the pipe syntax (`|User-Agent=...`).
- This explicitly tells the player: "When you go to this new URL, use these specific headers."
- This ensures maximum compatibility with players that support this syntax.

## 🔄 Verification
1.  **Wait 1-2 minutes** for the deployment to finish.
2.  **Retry Playback:** Ask the user to try playing the channel in OTT Navigator again.
3.  **No Playlist Refresh Needed:** Unlike the previous fix, this change happens at the redirect level, so it *might* work without a playlist refresh, but refreshing is always recommended to be safe.

**Commit:** `Fix redirect URL: Append User-Agent/Referer headers via pipe for player compatibility`
