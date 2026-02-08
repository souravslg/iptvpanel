# Testing Expired User Blocking

## ✅ Quick Test Steps

### 1. Wait for Vercel Deployment
- Go to your Vercel dashboard
- Check that commit `5858a47` is deployed
- Status should show "Ready" (green checkmark)
- Usually takes 2-3 minutes

### 2. Test Expired User Access

**User Details:**
- Username: `ufpr6xw8`
- Password: `xblxgafray`
- Expiry Date: `9/21/2025` (EXPIRED - 5 months ago)
- Status: `Active`
- Expected: **BLOCKED** ❌

**Test URL:**
```
https://your-vercel-url.vercel.app/live/ufpr6xw8/xblxgafray/1.ts
```

Replace `your-vercel-url` with your actual Vercel project URL.

**Expected Behavior:**
- ❌ Should NOT play the channel
- ✅ Should redirect to: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
- ✅ Browser/player shows Big Buck Bunny video

---

## 🧪 Detailed Testing

### Test 1: Expired User (Should Be Blocked)

**Using Browser:**
1. Open browser
2. Go to: `https://your-panel-url.vercel.app/live/ufpr6xw8/xblxgafray/1.ts`
3. You should see Big Buck Bunny video playing
4. ✅ **PASS** if you see the video
5. ❌ **FAIL** if you see a channel or error

**Using VLC Player:**
1. Open VLC
2. Media → Open Network Stream
3. Enter: `https://your-panel-url.vercel.app/live/ufpr6xw8/xblxgafray/1.ts`
4. Click Play
5. You should see Big Buck Bunny video
6. ✅ **PASS** if you see the video

**Using IPTV App:**
1. Open your IPTV app
2. Use credentials: `ufpr6xw8` / `xblxgafray`
3. Try to play any channel
4. All channels should show Big Buck Bunny video
5. ✅ **PASS** if all channels show the same video

---

### Test 2: Active User (Should Work Normally)

Create a test user with future expiry:

**SQL to create test user:**
```sql
INSERT INTO users (username, password, status, expire_date, package, max_connections)
VALUES (
    'test_active',
    'test123',
    'Active',
    '2027-12-31',  -- Future date
    'Full Package',
    1
);
```

**Test URL:**
```
https://your-panel-url.vercel.app/live/test_active/test123/1.ts
```

**Expected Behavior:**
- ✅ Should play the actual channel
- ❌ Should NOT show Big Buck Bunny

---

### Test 3: Disabled User (Should Be Blocked)

**SQL to create disabled user:**
```sql
INSERT INTO users (username, password, status, expire_date, package, max_connections)
VALUES (
    'test_disabled',
    'test123',
    'Disabled',
    '2027-12-31',  -- Future date but status is Disabled
    'Full Package',
    1
);
```

**Test URL:**
```
https://your-panel-url.vercel.app/live/test_disabled/test123/1.ts
```

**Expected Behavior:**
- ❌ Should NOT play the channel
- ✅ Should show Big Buck Bunny video

---

## 📊 Test Results Table

| Test | Username | Status | Expiry Date | Expected Result | Actual Result |
|------|----------|--------|-------------|-----------------|---------------|
| 1    | ufpr6xw8 | Active | 9/21/2025 (expired) | Blocked (video) | ? |
| 2    | test_active | Active | 12/31/2027 (future) | Allowed (channel) | ? |
| 3    | test_disabled | Disabled | 12/31/2027 (future) | Blocked (video) | ? |

---

## 🔍 Checking Logs

### Vercel Logs:
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Logs" tab
4. Try accessing a stream as expired user
5. Look for this log entry:

```
User check: {
  username: 'ufpr6xw8',
  status: 'Active',
  expireDate: '2025-09-21',
  isExpired: true,
  isActive: false,
  now: '2026-02-08T...'
}
User inactive/expired, redirecting to: https://commondatastorage...
```

If you see `isExpired: true` and `isActive: false`, the blocking is working! ✅

---

## ❌ Troubleshooting

### Issue: Still Playing Channels

**Possible Causes:**
1. **Deployment not complete** - Wait 2-3 minutes and try again
2. **Cache issue** - Clear browser cache or use incognito mode
3. **Settings not saved** - Verify settings in Supabase:
   ```sql
   SELECT * FROM settings WHERE key = 'invalid_subscription_video';
   ```
4. **Wrong URL** - Make sure you're using your Vercel URL

**Solutions:**
- Hard refresh browser (Ctrl+F5)
- Try in incognito/private mode
- Check Vercel deployment status
- Check Vercel logs for errors

### Issue: Error Instead of Video

**Possible Causes:**
1. **Settings table query failing** - Check Supabase logs
2. **Invalid video URL** - Video URL might be blocked

**Solutions:**
- Check Vercel logs for error messages
- Verify settings table has the video URL
- Try a different video URL (MP4 format recommended)

---

## 🎯 Quick Verification Commands

### Check User Expiry Status:
```sql
SELECT 
    username,
    status,
    expire_date,
    expire_date < NOW() as is_expired,
    CASE 
        WHEN status = 'Active' AND expire_date >= NOW() THEN 'ALLOWED ✅'
        ELSE 'BLOCKED ❌'
    END as access_status
FROM users
WHERE username = 'ufpr6xw8';
```

### Check Settings:
```sql
SELECT * FROM settings 
WHERE key IN ('invalid_subscription_video', 'server_name', 'server_url');
```

### Update Video URL (if needed):
```sql
UPDATE settings 
SET value = 'https://your-custom-video-url.mp4'
WHERE key = 'invalid_subscription_video';
```

---

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ Expired user (`ufpr6xw8`) sees Big Buck Bunny video
2. ✅ Active user (future expiry) sees actual channels
3. ✅ Disabled user sees Big Buck Bunny video
4. ✅ Logs show correct expiry detection
5. ✅ Settings page can update video URL

---

## 📞 Next Steps

After testing:

1. **If working:** 
   - Upload your custom "Subscription Expired" video
   - Update the video URL in Settings page
   - Test with real users

2. **If not working:**
   - Check Vercel deployment status
   - Review Vercel logs
   - Verify settings table data
   - Share error messages for debugging

---

## 🎬 Creating Your Custom Video

**Recommended content:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⚠️  SUBSCRIPTION EXPIRED  ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your IPTV subscription has expired.

To renew your subscription:

📧 Email: support@your-domain.com
📱 WhatsApp: +1234567890
🌐 Website: www.your-domain.com

Renew now to restore access!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Video specs:**
- Format: MP4 (H.264)
- Resolution: 1920x1080 or 1280x720
- Duration: 30-60 seconds
- Loop: Yes
- Audio: Optional voiceover

**Free tools:**
- Canva (online)
- Kapwing (online)
- DaVinci Resolve (free desktop app)

---

**Good luck with testing! Let me know the results!** 🚀
