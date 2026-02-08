# 🎬 QUICK GUIDE: Change Expired User Video

## ✅ Your Feature is Already Built-In!

You can change the video that expired users see **right now** from your admin panel!

---

## 🚀 FASTEST METHOD (2 Minutes)

### Step 1: Go to Settings
```
Your Admin Panel → Settings (in sidebar)
```

### Step 2: Find "Invalid Subscription Video"
Look for the section with the red video icon 🎥

### Step 3: Enter Your Video URL
```
Current (default):
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

Change to YOUR video:
https://your-cdn.com/subscription-expired.mp4
```

### Step 4: Save
Click **"Save Changes"** button

### ✅ DONE!
Expired users now see your custom video!

---

## 📹 What Video Should I Use?

### Create a video that says:
```
"Your IPTV Subscription Has Expired"

"Please contact us to renew:"
📞 Phone: +1234567890
💬 WhatsApp: +1234567890
🌐 Website: www.yoursite.com

"Thank you for choosing our service!"
```

### Video Specs:
- **Format:** MP4, M3U8, or TS
- **Length:** 10-30 seconds (looped)
- **Size:** Keep it small for fast loading
- **Resolution:** 720p or 1080p

---

## 🎨 Where to Create Your Video?

### Free Tools:
1. **Canva** - Easy video maker with templates
2. **Kapwing** - Online video editor
3. **InVideo** - Professional templates
4. **PowerPoint** - Export as video

### What to Include:
- ✅ Your logo/branding
- ✅ "Subscription Expired" message
- ✅ Contact information
- ✅ How to renew
- ✅ Professional look

---

## 📤 Where to Host Your Video?

### Free Options:
1. **Google Drive**
   - Upload video
   - Make it public
   - Get shareable link
   - Use direct link

2. **Dropbox**
   - Upload video
   - Get public link
   - Add `?dl=1` at the end

3. **Cloudinary** (Recommended)
   - Free CDN
   - Fast delivery
   - Easy to use

### Paid Options (Better):
1. **Bunny CDN** - $1/month, super fast
2. **AWS S3** - Pay as you go
3. **DigitalOcean Spaces** - $5/month

---

## 🧪 How to Test

### 1. Create a Test User
```
Username: testexpired
Password: test123
Expire Date: Yesterday (2026-02-07)
Status: Active
```

### 2. Try to Access a Stream
```
https://your-domain.com/live/testexpired/test123/123.m3u8
```

### 3. Result
✅ You should see your custom "Subscription Expired" video!

---

## 💡 Pro Tips

### 1. Make it Professional
- Use your brand colors
- Add your logo
- Professional voiceover or text

### 2. Keep it Short
- 10-30 seconds max
- Loop the video
- Clear message

### 3. Include Call-to-Action
- Phone number
- WhatsApp link
- Website URL
- Email address

### 4. Use Fast Hosting
- Frustrated users won't wait
- Use a CDN
- Test the loading speed

---

## 📊 Current Setup

### Default Video:
```
URL: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
Type: Sample cartoon video
```

### Who Sees This Video:
- ✅ Users with **expired** subscriptions
- ✅ Users with **inactive** status
- ✅ Users trying to access streams after expiry

### Who DOESN'T See This:
- ❌ Active users with valid subscriptions
- ❌ Users within their subscription period

---

## 🔧 Alternative: Use the Script

If you prefer command line:

### 1. Edit the Script
```javascript
// In update_expired_video.js, line 9:
const newVideoUrl = 'https://your-cdn.com/expired.mp4';
```

### 2. Run It
```bash
node update_expired_video.js
```

### 3. Done!
The script will update the database and confirm the change.

---

## ❓ FAQ

### Q: What formats are supported?
**A:** MP4, M3U8 (HLS), TS (MPEG-TS)

### Q: Can I use YouTube videos?
**A:** Not directly. Download the video first, then upload to a CDN.

### Q: How long should the video be?
**A:** 10-30 seconds, looped. Keep it short and clear.

### Q: Will this affect active users?
**A:** No! Only expired/inactive users see this video.

### Q: Can I change it anytime?
**A:** Yes! Just update the URL in Settings and save.

### Q: Do I need to restart the server?
**A:** No! Changes take effect immediately.

---

## ✅ Summary

1. **Go to Settings** in your admin panel
2. **Find "Invalid Subscription Video"** section
3. **Paste your video URL**
4. **Click "Save Changes"**
5. **Test with an expired user**
6. **Done!** ✅

---

**Need the full guide?** See `HOW_TO_CHANGE_EXPIRED_VIDEO.md`

**Ready to change it?** Go to your **Settings page** now! 🚀
