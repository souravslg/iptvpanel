# 🔧 Fix: Unable to Add Secondary Playlist

## ❌ Error Message

```
Playlist created but import failed: duplicate key value violates unique 
constraint "streams_stream_id_key"
```

## 🔍 Root Cause

The `streams` table has a **UNIQUE constraint** on the `stream_id` column. This means:

- ✅ **First playlist:** Works fine (no duplicates yet)
- ❌ **Second playlist:** Fails because some channels have the same `stream_id` as channels in the first playlist

**Example:**
```
Playlist 1: Channel "CNN" with stream_id = "1"
Playlist 2: Channel "BBC" with stream_id = "1"  ← CONFLICT!
```

The database says: "stream_id '1' already exists!" and rejects the import.

---

## ✅ Solution

Change the UNIQUE constraint from:
- **Before:** `stream_id` must be unique globally
- **After:** `stream_id` must be unique **within each playlist**

This allows the same `stream_id` to exist in different playlists.

---

## 🛠️ How to Fix (3 Steps)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run the Fix SQL

Copy and paste this SQL into the editor:

```sql
-- Remove the global UNIQUE constraint on stream_id
ALTER TABLE streams DROP CONSTRAINT IF EXISTS streams_stream_id_key;

-- Add a composite UNIQUE constraint (playlist_id + stream_id)
ALTER TABLE streams ADD CONSTRAINT streams_playlist_stream_unique 
    UNIQUE (playlist_id, stream_id);
```

### Step 3: Click "Run"

- Click the **"Run"** button
- You should see: **"Success. No rows returned"**
- Done! ✅

---

## 🧪 Test It

After running the SQL:

1. Go to **Playlist Management**
2. Click **"Create New Playlist"**
3. Enter a name (e.g., "jtvv")
4. Paste your M3U URL
5. Click **"Create"**
6. **It should work now!** ✅

---

## 📊 What Changed

### Database Structure:

**Before:**
```
streams table:
- id (primary key)
- stream_id (UNIQUE) ← Problem!
- playlist_id
- name
- url
...
```

**After:**
```
streams table:
- id (primary key)
- stream_id
- playlist_id
- name
- url
...
UNIQUE constraint on (playlist_id, stream_id) ← Fixed!
```

### What This Means:

**Before:**
```
❌ Playlist 1: stream_id = "1"
❌ Playlist 2: stream_id = "1"  ← ERROR!
```

**After:**
```
✅ Playlist 1: stream_id = "1"
✅ Playlist 2: stream_id = "1"  ← OK! (different playlist)
❌ Playlist 1: stream_id = "1" (duplicate in same playlist) ← Still ERROR
```

---

## 🎯 Benefits

1. ✅ **Multiple playlists work** - No more duplicate errors
2. ✅ **Data integrity maintained** - No duplicates within same playlist
3. ✅ **Existing data safe** - Doesn't affect current channels
4. ✅ **Future-proof** - Add as many playlists as you want

---

## ⚠️ Important Notes

### If You Have Existing Duplicates:

If you already have duplicate `stream_id` values in your database (from failed imports), you may need to clean them up first.

**Check for duplicates:**
```sql
SELECT stream_id, COUNT(*) 
FROM streams 
WHERE stream_id IS NOT NULL 
GROUP BY stream_id 
HAVING COUNT(*) > 1;
```

**If you find duplicates, you have two options:**

**Option 1: Delete all streams and start fresh**
```sql
DELETE FROM streams;
```

**Option 2: Keep only one of each duplicate**
```sql
DELETE FROM streams a USING streams b
WHERE a.id < b.id 
AND a.stream_id = b.stream_id;
```

---

## 🚀 Alternative: Quick Fix Script

If you prefer, I can create a script that does this automatically. But the SQL method above is faster and more reliable.

---

## 📝 Summary

**Problem:** UNIQUE constraint on `stream_id` prevents multiple playlists  
**Solution:** Change to composite UNIQUE on `(playlist_id, stream_id)`  
**How:** Run the SQL in Supabase SQL Editor  
**Result:** Multiple playlists work perfectly! ✅

---

## ✅ After the Fix

You'll be able to:

1. ✅ Create multiple playlists
2. ✅ Import channels into each playlist
3. ✅ Switch between playlists
4. ✅ Manage playlists independently

**No more "duplicate key" errors!** 🎉

---

## 📞 Need Help?

If you encounter any issues:

1. Check the Supabase SQL Editor for error messages
2. Make sure you're running the SQL on the correct database
3. Verify you have the `playlist_id` column in the `streams` table
4. If problems persist, let me know!

---

**File to run:** `FIX_PLAYLIST_CONSTRAINT.sql`  
**Where to run:** Supabase SQL Editor  
**Time needed:** 30 seconds  
**Risk:** Low (safe to run)
