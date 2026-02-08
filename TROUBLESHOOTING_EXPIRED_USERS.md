# Troubleshooting: Expired Users Still Able to Watch

## Issue
Customers with expired subscriptions can still watch TV channels.

## Root Causes & Solutions

### 1. Settings Table Not Created ✅ **MOST LIKELY**

**Problem**: The `settings` table doesn't exist in your Supabase database.

**Solution**:
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the contents of `CREATE_SETTINGS_TABLE.sql`
5. Click **"Run"** or press `Ctrl+Enter`
6. Verify it worked by checking the output

**Quick Test**:
```sql
SELECT * FROM settings;
```
If this returns an error, the table doesn't exist.

---

### 2. Date Format Issues

**Problem**: The expiry date might be stored in the wrong format.

**Check**:
1. Go to Supabase → Table Editor → `users` table
2. Look at the `expire_date` column
3. It should be in format: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`

**Example**:
- ✅ Correct: `2025-09-21` or `2025-09-21 23:59:59`
- ❌ Wrong: `9/21/2025` or `21-09-2025`

**Fix** (if needed):
```sql
-- Update date format if stored incorrectly
UPDATE users 
SET expire_date = TO_TIMESTAMP(expire_date, 'MM/DD/YYYY')::DATE
WHERE expire_date IS NOT NULL;
```

---

### 3. Timezone Issues

**Problem**: Server timezone vs user timezone mismatch.

**Check Server Time**:
```sql
SELECT NOW();
```

**Fix**: Ensure dates are stored in UTC or your local timezone consistently.

---

### 4. Status Field Issues

**Problem**: User status is not exactly "Active" (case-sensitive).

**Check**:
```sql
SELECT username, status, expire_date 
FROM users 
WHERE username = 'your-test-user';
```

**Possible Issues**:
- Status is `"active"` (lowercase) instead of `"Active"`
- Status has extra spaces: `"Active "` or `" Active"`
- Status is NULL

**Fix**:
```sql
-- Standardize status values
UPDATE users 
SET status = 'Active' 
WHERE LOWER(TRIM(status)) = 'active';

UPDATE users 
SET status = 'Disabled' 
WHERE LOWER(TRIM(status)) = 'disabled';
```

---

### 5. Caching Issues

**Problem**: Old authentication tokens or cached responses.

**Solutions**:
1. **Clear user's app cache**
2. **Restart IPTV app**
3. **Re-login with credentials**
4. **Check if using old M3U URL**

---

## Testing Expired User Blocking

### Step 1: Create Test User with Expired Date

```sql
-- Create a test user that expired yesterday
INSERT INTO users (username, password, status, expire_date, package, max_connections)
VALUES (
    'test_expired',
    'test123',
    'Active',
    CURRENT_DATE - INTERVAL '1 day',  -- Yesterday
    'Full Package',
    1
);
```

### Step 2: Test Access

Try accessing a stream:
```
http://your-panel.com/live/test_expired/test123/123.ts
```

**Expected Result**: Should redirect to invalid subscription video

### Step 3: Check Logs

Look at your Vercel/server logs for:
```
User check: {
  username: 'test_expired',
  status: 'Active',
  expireDate: '2026-02-07',
  isExpired: true,
  isActive: false,
  now: '2026-02-08T...'
}
User inactive/expired, redirecting to: https://...
```

---

## Debugging Steps

### 1. Check User Data
```sql
SELECT 
    username,
    status,
    expire_date,
    expire_date < NOW() as is_expired,
    CASE 
        WHEN status = 'Active' AND (expire_date IS NULL OR expire_date >= NOW()) THEN 'ALLOWED'
        ELSE 'BLOCKED'
    END as access_status
FROM users
WHERE username = 'ufpr6xw8';
```

### 2. Check Settings Table
```sql
SELECT * FROM settings;
```

### 3. Test Date Comparison
```sql
SELECT 
    '2025-09-21'::DATE as expire_date,
    NOW() as current_time,
    '2025-09-21'::DATE < NOW() as is_expired;
```

### 4. Check Logs

**Vercel Logs**:
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Logs" tab
4. Look for "User check:" entries

**Local Logs**:
```bash
# If running locally
npm run dev
# Then access a stream and watch console
```

---

## Common Mistakes

### ❌ Mistake 1: Expiry Date in Future
```
expire_date: 2025-09-21  (This is in the FUTURE!)
```
User will still have access until this date passes.

### ❌ Mistake 2: Status is "Disabled" but you expect blocking
```
status: 'Disabled'
```
This will block the user regardless of expiry date.

### ❌ Mistake 3: Settings Table Missing
```
ERROR: relation "settings" does not exist
```
Run the CREATE_SETTINGS_TABLE.sql script!

### ❌ Mistake 4: Wrong Date Format
```
expire_date: "9/21/2025"  (String, not Date!)
```
Should be: `2025-09-21` (Date type)

---

## Quick Fixes

### Fix 1: Block User Immediately
```sql
UPDATE users 
SET status = 'Disabled' 
WHERE username = 'ufpr6xw8';
```

### Fix 2: Set Expiry to Yesterday
```sql
UPDATE users 
SET expire_date = CURRENT_DATE - INTERVAL '1 day'
WHERE username = 'ufpr6xw8';
```

### Fix 3: Create Settings Table
```sql
-- Run CREATE_SETTINGS_TABLE.sql
```

### Fix 4: Verify Blocking Works
```sql
-- Check if user should be blocked
SELECT 
    username,
    status,
    expire_date,
    CASE 
        WHEN status != 'Active' THEN 'BLOCKED: Status not Active'
        WHEN expire_date < NOW() THEN 'BLOCKED: Expired'
        ELSE 'ALLOWED'
    END as result
FROM users
WHERE username = 'ufpr6xw8';
```

---

## Expected Behavior

### ✅ User Should Be BLOCKED When:
1. `status != 'Active'` (e.g., "Disabled", "Suspended")
2. `expire_date < NOW()` (date is in the past)
3. Both conditions above

### ✅ User Should Be ALLOWED When:
1. `status = 'Active'` AND
2. `expire_date >= NOW()` (date is today or future) OR `expire_date IS NULL`

---

## Still Not Working?

### Check These:

1. **Redeploy Application**
   - The code changes need to be deployed to Vercel
   - Check if latest commit is deployed

2. **Database Connection**
   - Verify Supabase connection is working
   - Check environment variables

3. **User's IPTV App**
   - Some apps cache the M3U playlist
   - User needs to refresh/reload playlist
   - Or restart the app

4. **Direct Stream Access**
   - If user has direct stream URLs (not via your panel)
   - They can bypass your authentication
   - Solution: Use DRM or token-based authentication

---

## Contact Support

If issue persists:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Share the output of:
   ```sql
   SELECT username, status, expire_date, created_at 
   FROM users 
   WHERE username = 'ufpr6xw8';
   ```
4. Share server logs showing the "User check:" output
