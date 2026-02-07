# 🔧 Fix "Failed to save playlist" Error

## ❌ Problem Identified

The DRM columns are **missing** from your Supabase `streams` table. This is causing the "Failed to save playlist" error.

## ✅ Solution: Run DRM Migration

You need to execute the DRM migration SQL in your Supabase database.

---

## 📋 Step-by-Step Fix

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar (or go to the SQL icon)

### Step 2: Copy the Migration SQL

Copy this entire SQL script:

```sql
-- Add DRM and MPD support fields to streams table

-- Add new columns for DRM support
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_scheme TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_license_url TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_key_id TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_key TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS stream_format TEXT DEFAULT 'hls';
ALTER TABLE streams ADD COLUMN IF NOT EXISTS headers JSONB;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS channel_number INTEGER;

-- Update existing records to have default stream_format
UPDATE streams SET stream_format = 'hls' WHERE stream_format IS NULL;

-- Create index for channel_number for better sorting performance
CREATE INDEX IF NOT EXISTS idx_streams_channel_number ON streams(channel_number);

-- Add comments for documentation
COMMENT ON COLUMN streams.drm_scheme IS 'DRM scheme: widevine, playready, fairplay, clearkey';
COMMENT ON COLUMN streams.drm_license_url IS 'DRM license server URL';
COMMENT ON COLUMN streams.drm_key_id IS 'DRM key ID for ClearKey';
COMMENT ON COLUMN streams.drm_key IS 'DRM key for ClearKey';
COMMENT ON COLUMN streams.stream_format IS 'Stream format: hls, mpd, rtmp, ts';
COMMENT ON COLUMN streams.headers IS 'Custom HTTP headers as JSON object';
COMMENT ON COLUMN streams.channel_number IS 'Custom channel number for ordering';
```

### Step 3: Run the SQL

1. **Paste the SQL** into the SQL Editor
2. **Click "Run"** or press `Ctrl+Enter`
3. **Wait for success message**: "Success. No rows returned" (this is normal!)

### Step 4: Verify

Run this verification query in the SQL Editor:

```sql
-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'streams' 
AND column_name IN ('drm_scheme', 'drm_license_url', 'drm_key_id', 'drm_key', 'stream_format', 'channel_number')
ORDER BY column_name;
```

You should see all 6 columns listed.

### Step 5: Test Upload Again

1. **Refresh your browser** (to clear any cached errors)
2. **Go to Playlist Management**
3. **Try uploading your M3U file again**
4. ✅ **It should work now!**

---

## 🎯 Quick Copy-Paste

**For Supabase SQL Editor:**

```sql
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_scheme TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_license_url TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_key_id TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS drm_key TEXT;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS stream_format TEXT DEFAULT 'hls';
ALTER TABLE streams ADD COLUMN IF NOT EXISTS headers JSONB;
ALTER TABLE streams ADD COLUMN IF NOT EXISTS channel_number INTEGER;

UPDATE streams SET stream_format = 'hls' WHERE stream_format IS NULL;

CREATE INDEX IF NOT EXISTS idx_streams_channel_number ON streams(channel_number);
```

---

## 🔍 What This Does

Adds these columns to your `streams` table:

| Column | Type | Purpose |
|--------|------|---------|
| `drm_scheme` | TEXT | DRM type (widevine, playready, fairplay, clearkey) |
| `drm_license_url` | TEXT | License server URL |
| `drm_key_id` | TEXT | Key ID for ClearKey DRM |
| `drm_key` | TEXT | Decryption key for ClearKey |
| `stream_format` | TEXT | Stream format (hls, mpd, rtmp, ts) |
| `channel_number` | INTEGER | Custom channel number |
| `headers` | JSONB | Custom HTTP headers |

---

## ⚠️ Important Notes

- **Safe to run multiple times**: Uses `IF NOT EXISTS` so it won't error if columns already exist
- **No data loss**: Only adds columns, doesn't modify existing data
- **Instant**: Takes less than 1 second to execute
- **Reversible**: Can drop columns if needed (not recommended)

---

## 🐛 Troubleshooting

### Error: "permission denied"
- Make sure you're logged into the correct Supabase project
- Check that you have admin access

### Error: "relation does not exist"
- Make sure the `streams` table exists
- Check you're in the correct database

### Still getting "Failed to save playlist"
1. Clear browser cache
2. Check browser console for errors (F12)
3. Verify columns were added (run verification query above)

---

## ✅ After Running Migration

Once the migration is complete, you'll be able to:
- ✅ Upload M3U playlists with DRM
- ✅ Import from URLs with DRM
- ✅ Edit channels with DRM settings
- ✅ Play DRM-protected content
- ✅ Set custom channel numbers

---

**Run the SQL now and your playlist uploads will work!** 🚀
