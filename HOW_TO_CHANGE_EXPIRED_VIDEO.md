# 🎬 How to Change Expired User Video URL

## ✅ Good News!

Your IPTV panel **already has this feature built-in**! You can change the video that expired users see in two ways:

---

## 📱 Method 1: Using the Admin Panel (Easiest)

### Steps:

1. **Go to Settings Page**
   - Open your admin panel
   - Click on **"Settings"** in the sidebar
   - Or navigate to: `https://your-domain.com/settings`

2. **Find "Invalid Subscription Video" Section**
   - Scroll down to the section with a red video icon 🎥
   - You'll see a field labeled **"Video URL"**

3. **Enter Your Custom Video URL**
   - Paste the URL of your custom video
   - Example: `https://your-cdn.com/subscription-expired.mp4`
   - Supported formats: **MP4, M3U8, TS**

4. **Save Changes**
   - Click the **"Save Changes"** button
   - You'll see a success message

5. **Done!** ✅
   - Expired users will now see your custom video

---

## 💻 Method 2: Using the Script (For Bulk Updates)

### Steps:

1. **Edit the Script**
   - Open: `update_expired_video.js`
   - Find line 9: `const newVideoUrl = '...'`
   - Replace with your video URL:
     ```javascript
     const newVideoUrl = 'https://your-cdn.com/subscription-expired.mp4';
     ```

2. **Run the Script**
   ```bash
   node update_expired_video.js
   ```

3. **Verify**
   - The script will show you the current and new URL
   - Confirms the update was successful

---

## 🎥 How to Create a Custom "Subscription Expired" Video

### Option 1: Use a Free Video Hosting Service

1. **Create your video** (e.g., "Your subscription has expired. Please renew.")
2. **Upload to:**
   - **Google Drive** (make it public, get direct link)
   - **Dropbox** (get public link)
   - **YouTube** (use a video downloader to get direct MP4 link)
   - **Cloudinary** (free CDN)
   - **Bunny CDN** (cheap and fast)

3. **Get the direct video URL**
   - Must end with `.mp4`, `.m3u8`, or `.ts`
   - Example: `https://cdn.example.com/expired.mp4`

### Option 2: Use a Sample Video (For Testing)

Here are some free sample videos you can use:

```
Big Buck Bunny (Default):
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

Elephants Dream:
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4

Sintel:
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4
```

---

## 🔍 How It Works

### When a User is Expired:

```
1. User tries to watch a channel
   ↓
2. System checks: Is user active? Is subscription valid?
   ↓
3. If EXPIRED or INACTIVE:
   → Redirect to your custom video URL
   ↓
4. User sees your "Subscription Expired" message
```

### Code Flow:

**File:** `/app/live/[username]/[password]/[streamId]/route.js`

```javascript
// Lines 56-78
if (!isActive) {
    // Fetch custom video URL from settings
    const { data: settingRow } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'invalid_subscription_video')
        .single();

    const invalidSubVideo = settingRow?.value || 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    // Redirect to custom video
    return NextResponse.redirect(invalidSubVideo);
}
```

---

## 📊 Current Default Video

**URL:** `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`

This is a free sample video (Big Buck Bunny cartoon). You should replace it with your own custom video that says something like:

> "Your IPTV subscription has expired. Please contact support or renew your subscription to continue watching."

---

## ✅ Testing

### To test if it works:

1. **Create a test user** with an expired date
2. **Try to access a stream** using that user's credentials
3. **You should see your custom video** instead of the actual channel

### Test URL Format:
```
https://your-domain.com/live/[username]/[password]/[stream-id].m3u8
```

Example:
```
https://your-domain.com/live/testuser/testpass/123.m3u8
```

If `testuser` is expired, they'll see your custom video! ✅

---

## 💡 Pro Tips

### 1. **Create a Professional Video**
   - Use Canva or similar tools
   - Add your logo and branding
   - Include contact information
   - Keep it short (10-30 seconds, looped)

### 2. **Host on a Fast CDN**
   - Users will see this video when they're frustrated
   - Make sure it loads quickly
   - Use a reliable hosting service

### 3. **Include a Call-to-Action**
   - "Visit our website to renew"
   - "Contact support: +1234567890"
   - "WhatsApp: +1234567890"

### 4. **Make it Loop**
   - So the message keeps playing
   - Users will understand they need to renew

---

## 🚀 Quick Start

**Fastest way to change it right now:**

1. Go to: **Settings** page in your admin panel
2. Paste your video URL in the **"Invalid Subscription Video"** field
3. Click **"Save Changes"**
4. Done! ✅

---

## 📝 Summary

✅ **Feature is already built-in**
✅ **Change via Settings page** (easiest)
✅ **Or use the script** for bulk updates
✅ **Supports MP4, M3U8, TS formats**
✅ **Works for expired AND inactive users**

---

**Need help?** Check the Settings page in your admin panel - it's all there! 🎉
