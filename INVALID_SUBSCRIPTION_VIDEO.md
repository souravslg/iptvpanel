# Invalid Subscription Video Feature

## Overview

When a user's subscription is expired or inactive, instead of showing an error, the system will redirect them to a custom "Invalid Subscription" video. This provides a better user experience and can display a branded message.

## How It Works

1. **User Authentication**: When a user tries to access a stream via the Xtream API
2. **Subscription Check**: The system checks if the user's subscription is:
   - Active (status = 'Active')
   - Not expired (expire_date > current date)
3. **Redirect**: If subscription is invalid, user is redirected to the configured video instead of receiving a 401 error

## Configuration

### Setting Up the Invalid Subscription Video

1. **Go to Settings Page** (`/settings`)
2. **Find "Invalid Subscription Video" section**
3. **Enter your video URL** in the "Video URL" field
4. **Click "Save Changes"**

### Video Requirements

- **Format**: MP4, M3U8, TS, or any format supported by video players
- **Hosting**: Must be publicly accessible URL
- **Recommended**: Use a CDN for better performance
- **Content**: Should inform users about expired/inactive subscription

### Example Video URLs

**Default (Sample)**:
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```

**Custom HLS Stream**:
```
https://your-cdn.com/invalid-subscription.m3u8
```

**Custom MP4**:
```
https://your-server.com/videos/subscription-expired.mp4
```

## Creating Your Own Invalid Subscription Video

### Recommended Content

Your video should include:
- ✅ Clear message: "Subscription Expired" or "Account Inactive"
- ✅ Contact information (support email, phone, website)
- ✅ Instructions to renew subscription
- ✅ Your branding (logo, colors)
- ✅ Duration: 30-60 seconds (looping)

### Video Specifications

- **Resolution**: 1920x1080 (Full HD) or 1280x720 (HD)
- **Format**: MP4 (H.264 video, AAC audio)
- **Bitrate**: 2-5 Mbps
- **Frame Rate**: 24-30 fps
- **Audio**: Clear voiceover or background music

### Tools to Create Video

1. **Canva** - Easy online video maker
2. **Adobe Premiere** - Professional video editing
3. **DaVinci Resolve** - Free professional editor
4. **Kapwing** - Online video editor

## Database Schema

The settings are stored in the `settings` table:

```sql
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    invalid_subscription_video TEXT,
    server_name TEXT,
    server_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Get Settings
```
GET /api/settings
```

**Response**:
```json
{
  "invalid_subscription_video": "https://example.com/video.mp4",
  "server_name": "IPTV Panel",
  "server_url": "https://your-domain.com"
}
```

### Update Settings
```
PUT /api/settings
Content-Type: application/json

{
  "invalid_subscription_video": "https://new-url.com/video.mp4",
  "server_name": "My IPTV",
  "server_url": "https://my-domain.com"
}
```

## Testing

### Test with Expired User

1. Create a test user with expired date in the past
2. Try to access a stream using Xtream API:
   ```
   http://your-panel.com/live/username/password/123.ts
   ```
3. You should be redirected to the invalid subscription video

### Test with Inactive User

1. Create a user and set status to "Disabled"
2. Try to access any stream
3. You should be redirected to the invalid subscription video

## Troubleshooting

### Video Not Playing

**Issue**: Users see error instead of video

**Solutions**:
- ✅ Check video URL is publicly accessible
- ✅ Verify video format is supported
- ✅ Test URL in browser directly
- ✅ Check CORS headers if using custom domain

### Video URL Not Saving

**Issue**: Settings not persisting

**Solutions**:
- ✅ Run the migration: `migrations/add_settings_table.sql`
- ✅ Check database connection
- ✅ Verify Supabase permissions

### Default Video Showing

**Issue**: Custom video not being used

**Solutions**:
- ✅ Verify settings are saved in database
- ✅ Check API endpoint `/api/settings` returns correct URL
- ✅ Clear browser cache
- ✅ Restart application

## Best Practices

1. **Use a CDN**: Host video on CloudFlare, AWS CloudFront, or similar
2. **Keep it Short**: 30-60 seconds maximum
3. **Loop the Video**: Set player to loop for continuous playback
4. **Test Regularly**: Ensure video URL remains accessible
5. **Backup URL**: Keep a backup video URL in case primary fails
6. **Monitor Access**: Check logs for users hitting invalid subscription

## Example Implementation

### Sample Invalid Subscription Message

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⚠️  SUBSCRIPTION EXPIRED  ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your IPTV subscription has expired.

To continue enjoying our services:

📧 Email: support@your-iptv.com
📱 WhatsApp: +1234567890
🌐 Website: www.your-iptv.com

Renew now to restore access!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Security Considerations

- ✅ Video URL should not contain sensitive information
- ✅ Use HTTPS for video hosting
- ✅ Don't expose internal server paths
- ✅ Rate limit access to prevent abuse
- ✅ Monitor for unusual access patterns

## Future Enhancements

Potential improvements:
- Multiple videos for different expiry reasons
- Localized videos for different languages
- Dynamic video generation with user info
- Analytics on invalid subscription attempts
- Email notification when users hit expired video
