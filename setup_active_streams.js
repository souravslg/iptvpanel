import { supabase } from './lib/supabase.js';

async function setupActiveStreamsTable() {
    console.log('Setting up active_streams table in Supabase...\n');

    try {
        // Note: Supabase doesn't support direct SQL execution from the client
        // You need to run this SQL in the Supabase SQL Editor

        const sql = `
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

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_active_streams_user_id ON active_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_active_streams_username ON active_streams(username);
CREATE INDEX IF NOT EXISTS idx_active_streams_last_ping ON active_streams(last_ping);
CREATE INDEX IF NOT EXISTS idx_active_streams_stream_id ON active_streams(stream_id);

-- View: current_active_streams
-- Shows only streams that have been pinged in the last 5 minutes
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

-- Function to clean up old inactive streams (older than 10 minutes)
CREATE OR REPLACE FUNCTION cleanup_inactive_streams()
RETURNS void AS $$
BEGIN
    DELETE FROM active_streams
    WHERE last_ping < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;
`;

        console.log('📋 Copy and paste the following SQL into your Supabase SQL Editor:');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
        console.log('\n✅ After running the SQL, the active_streams table will be ready!');
        console.log('\n📍 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');

        // Test if table exists by trying to query it
        console.log('\n🔍 Testing if active_streams table already exists...');
        const { data, error } = await supabase
            .from('active_streams')
            .select('count')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.log('❌ Table does not exist yet. Please run the SQL above in Supabase SQL Editor.');
            } else {
                console.log('⚠️  Error checking table:', error.message);
            }
        } else {
            console.log('✅ Table already exists and is accessible!');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

setupActiveStreamsTable();
