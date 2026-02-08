-- =====================================================
-- ACTIVE STREAMS TABLE SETUP FOR SUPABASE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- =====================================================

-- Create table to track active streams and user activity
CREATE TABLE IF NOT EXISTS active_streams (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    stream_id TEXT NOT NULL,
    stream_name TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_active_streams_user_id ON active_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_active_streams_username ON active_streams(username);
CREATE INDEX IF NOT EXISTS idx_active_streams_last_ping ON active_streams(last_ping);
CREATE INDEX IF NOT EXISTS idx_active_streams_stream_id ON active_streams(stream_id);

-- Create view for current active streams (last 5 minutes)
CREATE OR REPLACE VIEW current_active_streams AS
SELECT 
    a.id,
    a.username,
    a.stream_id,
    a.stream_name,
    a.started_at,
    a.last_ping,
    a.ip_address,
    u.status as user_status,
    u.expire_date,
    s.name as channel_name,
    s.category,
    s.logo,
    EXTRACT(EPOCH FROM (NOW() - a.started_at)) as watching_duration_seconds
FROM active_streams a
LEFT JOIN users u ON a.username = u.username
LEFT JOIN streams s ON a.stream_id = s.stream_id OR a.stream_id::text = s.id::text
WHERE a.last_ping > NOW() - INTERVAL '5 minutes'
ORDER BY a.last_ping DESC;

-- Create cleanup function for old inactive streams
CREATE OR REPLACE FUNCTION cleanup_inactive_streams()
RETURNS void AS $$
BEGIN
    DELETE FROM active_streams
    WHERE last_ping < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES (Optional - run after setup)
-- =====================================================

-- Check if table was created successfully
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'active_streams';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'active_streams';

-- Test the view
SELECT * FROM current_active_streams LIMIT 5;

-- =====================================================
-- DONE! Your active_streams table is ready to use.
-- =====================================================
