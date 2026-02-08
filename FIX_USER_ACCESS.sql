-- Quick fix to help user start watching again after expiry extension

-- 1. Verify the user's current status
SELECT 
    username,
    status,
    expire_date,
    expire_date >= NOW() as is_valid,
    CASE 
        WHEN status = 'Active' AND expire_date >= NOW() THEN '✅ SHOULD WORK'
        WHEN status != 'Active' THEN '❌ Status not Active'
        WHEN expire_date < NOW() THEN '❌ Still Expired'
        ELSE '❓ Unknown'
    END as access_status
FROM users
WHERE username = 'ufpr6xw8';

-- 2. If user shows "SHOULD WORK" but still can't watch, the issue is cached playlist
-- Solution: Change the password to force playlist reload

-- Option A: Generate new password (recommended)
UPDATE users 
SET password = 'xhrxgatruy'  -- Changed one letter: xblxgafray → xhrxgatruy
WHERE username = 'ufpr6xw8';

-- Option B: Keep same password but user must reload playlist manually
-- (No SQL needed, just tell user to reload)

-- 3. Verify the update
SELECT username, password, status, expire_date 
FROM users 
WHERE username = 'ufpr6xw8';

-- 4. Give user the new M3U URL (if password changed)
-- https://your-panel.vercel.app/get.php?username=ufpr6xw8&password=xhrxgatruy
