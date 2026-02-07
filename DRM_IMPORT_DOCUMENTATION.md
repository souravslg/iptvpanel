# DRM Import from M3U Playlists - Documentation

## ✅ What's Been Fixed

The M3U parser has been enhanced to automatically extract and save DRM information when importing playlists!

## 🎯 Supported M3U DRM Formats

### 1. **Extended EXTINF Attributes**

The parser now extracts DRM info from EXTINF line attributes:

```m3u
#EXTINF:-1 tvg-id="channel1" tvg-name="Channel 1" tvg-logo="logo.png" group-title="Movies" drm-scheme="widevine" drm-license-url="https://license.example.com/widevine",Channel 1
https://stream.example.com/channel1.mpd
```

**Supported attributes:**
- `drm-scheme` or `drm` - DRM type (widevine, playready, fairplay, clearkey)
- `drm-license-url` or `license-url` - License server URL
- `drm-key-id` or `key-id` - Key ID for ClearKey
- `drm-key` or `key` - Decryption key for ClearKey
- `stream-format` or `format` - Stream format (hls, mpd, rtmp, ts)
- `tvg-chno` or `channel-number` - Channel number

### 2. **Kodi Properties (#KODIPROP)**

Commonly used in Kodi/IPTV playlists with DRM:

```m3u
#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha
#KODIPROP:inputstream.adaptive.license_key=https://license.example.com/widevine|Content-Type=application/octet-stream|R{SSM}|
#KODIPROP:inputstream.adaptive.manifest_type=mpd
#EXTINF:-1 tvg-id="channel1" group-title="Movies",Channel 1
https://stream.example.com/channel1.mpd
```

**Supported properties:**
- `inputstream.adaptive.license_type` → DRM scheme
- `inputstream.adaptive.license_key` → License URL (before pipe `|`)
- `inputstream.adaptive.manifest_type` → Stream format (mpd/hls)
- `inputstream.adaptive.stream_headers` → Custom headers

### 3. **VLC Options (#EXTVLCOPT)**

Used in VLC-compatible playlists:

```m3u
#EXTVLCOPT:http-user-agent=Mozilla/5.0
#EXTVLCOPT:drm-license=https://license.example.com/widevine
#EXTVLCOPT:drm-scheme=widevine
#EXTINF:-1 tvg-id="channel1" group-title="Movies",Channel 1
https://stream.example.com/channel1.mpd
```

### 4. **Auto-Detection from URL**

If no format is specified, the parser auto-detects from the URL:

- `.mpd` → MPEG-DASH
- `.m3u8` → HLS
- `rtmp://` → RTMP
- `.ts` → Transport Stream

## 📝 Example M3U Files

### Example 1: Widevine DRM (MPEG-DASH)

```m3u
#EXTM3U

#EXTINF:-1 tvg-id="movie1" tvg-logo="https://example.com/logo.png" group-title="Movies" drm-scheme="widevine" drm-license-url="https://license.example.com/widevine" stream-format="mpd",Action Movie
https://stream.example.com/action-movie.mpd

#EXTINF:-1 tvg-id="movie2" tvg-logo="https://example.com/logo2.png" group-title="Movies" drm-scheme="widevine" drm-license-url="https://license.example.com/widevine" stream-format="mpd",Drama Movie
https://stream.example.com/drama-movie.mpd
```

### Example 2: ClearKey DRM

```m3u
#EXTM3U

#EXTINF:-1 tvg-id="test1" group-title="Test" drm-scheme="clearkey" drm-key-id="1234567890abcdef1234567890abcdef" drm-key="fedcba0987654321fedcba0987654321" stream-format="mpd",Test Channel
https://stream.example.com/test.mpd
```

### Example 3: Kodi Format with Widevine

```m3u
#EXTM3U

#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha
#KODIPROP:inputstream.adaptive.license_key=https://license.example.com/widevine|Content-Type=application/octet-stream|R{SSM}|
#KODIPROP:inputstream.adaptive.manifest_type=mpd
#EXTINF:-1 tvg-id="sports1" tvg-logo="https://example.com/sports.png" group-title="Sports",Sports Channel
https://stream.example.com/sports.mpd

#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha
#KODIPROP:inputstream.adaptive.license_key=https://license.example.com/widevine|Content-Type=application/octet-stream|R{SSM}|
#KODIPROP:inputstream.adaptive.manifest_type=mpd
#EXTINF:-1 tvg-id="sports2" tvg-logo="https://example.com/sports2.png" group-title="Sports",Sports Channel 2
https://stream.example.com/sports2.mpd
```

### Example 4: Mixed Formats

```m3u
#EXTM3U

# Regular HLS stream (no DRM)
#EXTINF:-1 tvg-id="free1" group-title="Free",Free Channel
https://stream.example.com/free.m3u8

# Widevine protected DASH stream
#EXTINF:-1 tvg-id="premium1" group-title="Premium" drm-scheme="widevine" drm-license-url="https://license.example.com/widevine",Premium Channel
https://stream.example.com/premium.mpd

# ClearKey protected stream
#EXTINF:-1 tvg-id="test1" group-title="Test" drm-scheme="clearkey" drm-key-id="abc123" drm-key="def456",Test Channel
https://stream.example.com/test.mpd
```

## 🚀 How to Import DRM Playlists

### Method 1: Upload M3U File

1. Go to **Playlist Management**
2. Click **"Upload M3U"**
3. Select your M3U file with DRM info
4. Click **Upload**
5. ✅ DRM fields are automatically extracted and saved!

### Method 2: Import from URL

1. Go to **Playlist Management**
2. Click **"Import from URL"**
3. Enter the M3U playlist URL
4. Click **Import**
5. ✅ DRM fields are automatically extracted and saved!

### Method 3: Create Playlist with Source URL

1. Click **"Manage Playlists"**
2. Click **"Create New Playlist"**
3. Fill in name and description
4. **Enter Source URL** (your M3U URL)
5. Click **Create**
6. ✅ Playlist is created and DRM info is imported!

## 🔍 Verifying DRM Import

After importing, check if DRM was extracted:

1. **Click Edit** (pencil icon) on any channel
2. **Scroll down** to "DRM Configuration" section
3. **Check the fields:**
   - DRM Scheme should show (Widevine, PlayReady, etc.)
   - License URL should be filled (if applicable)
   - Key ID & Key should be filled (for ClearKey)

## 📊 What Gets Extracted

From your M3U file, the parser extracts:

| Field | M3U Attribute | Database Column |
|-------|---------------|-----------------|
| Channel Name | After last comma | `name` |
| Stream URL | URL line | `url` |
| Logo | `tvg-logo` | `logo` |
| Category | `group-title` | `category` |
| **DRM Scheme** | `drm-scheme`, `drm`, Kodi props | `drm_scheme` |
| **License URL** | `drm-license-url`, Kodi props | `drm_license_url` |
| **Key ID** | `drm-key-id`, `key-id` | `drm_key_id` |
| **Key** | `drm-key`, `key` | `drm_key` |
| **Stream Format** | `stream-format`, auto-detect | `stream_format` |
| **Channel Number** | `tvg-chno`, `channel-number` | `channel_number` |

## 🧪 Testing

### Create a Test M3U File:

Save this as `test-drm.m3u`:

```m3u
#EXTM3U

#EXTINF:-1 tvg-id="test1" tvg-logo="https://via.placeholder.com/150" group-title="Test" drm-scheme="clearkey" drm-key-id="1234567890abcdef1234567890abcdef" drm-key="fedcba0987654321fedcba0987654321" stream-format="mpd" tvg-chno="101",Test DRM Channel
https://test-streams.mux.dev/test.mpd
```

Then:
1. Upload this file
2. Edit the channel
3. You should see:
   - DRM Scheme: ClearKey
   - Key ID: 1234567890abcdef1234567890abcdef
   - Key: fedcba0987654321fedcba0987654321
   - Stream Format: MPEG-DASH (.mpd)
   - Channel Number: 101

## ✅ Files Updated

1. **`lib/m3u.js`** - Enhanced parser with DRM extraction
2. **`app/api/playlist/route.js`** - Saves DRM fields on upload
3. **`app/api/playlists/import/route.js`** - Saves DRM fields on URL import

## 🎉 Summary

Now when you import M3U playlists:
- ✅ DRM scheme is automatically detected
- ✅ License URLs are extracted
- ✅ ClearKey keys are saved
- ✅ Stream format is detected
- ✅ Channel numbers are preserved
- ✅ All data is saved to the database
- ✅ Ready for playback with DRM support!

**Try importing your DRM playlist again - the DRM info should now appear!** 🚀
