-- Debug: Check if user should be able to watch

-- Check user status
SELECT 
    username,
    password,
    status,
    expire_date,
    NOW() as current_time,
    expire_date >= NOW() as is_future_date,
    expire_date < NOW() as is_expired,
    CASE 
        WHEN status = 'Active' AND (expire_date IS NULL OR expire_date >= NOW()) THEN '✅ SHOULD WORK'
        WHEN status != 'Active' THEN '❌ Status: ' || status
        WHEN expire_date < NOW() THEN '❌ Expired on: ' || expire_date
        ELSE '❓ Unknown issue'
    END as access_result
FROM users
WHERE username = 'ufpr6xw8';

-- Expected result:
-- username: ufpr6xw8
-- status: Active
-- expire_date: 2026-07-21
-- is_future_date: true
-- is_expired: false
-- access_result: ✅ SHOULD WORK
