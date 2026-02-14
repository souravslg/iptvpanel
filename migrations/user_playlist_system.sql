-- User-Specific Playlist Management System
-- Database Schema Migration

-- 1. Add playlist_token to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS playlist_token TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_limit INTEGER DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS playlist_created_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS playlist_last_accessed TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS playlist_access_count INTEGER DEFAULT 0;

-- 2. User Channel Permissions
-- Controls which channels each user can access
CREATE TABLE IF NOT EXISTS user_channel_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stream_id INTEGER NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stream_id)
);

CREATE INDEX IF NOT EXISTS idx_user_channel_permissions_user_id ON user_channel_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_channel_permissions_stream_id ON user_channel_permissions(stream_id);

-- 3. User Devices
-- Track devices accessing user playlists
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_ip TEXT NOT NULL,
    device_ua TEXT,
    device_name TEXT,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, device_ip)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active, last_seen);

-- 4. Playlist Access Logs
-- Track playlist downloads and accesses
CREATE TABLE IF NOT EXISTS playlist_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    stream_count INTEGER DEFAULT 0,
    device_info TEXT
);

CREATE INDEX IF NOT EXISTS idx_playlist_access_logs_user_id ON playlist_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_access_logs_accessed_at ON playlist_access_logs(accessed_at DESC);

-- Verification queries
-- Run these to verify tables were created successfully

-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('playlist_token', 'device_limit', 'playlist_created_at');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('user_channel_permissions', 'user_devices', 'playlist_access_logs')
AND table_schema = 'public';
