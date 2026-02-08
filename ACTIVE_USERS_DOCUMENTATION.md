# Active Users & Live Stream Tracking

This feature allows you to monitor active users and their currently playing TV channels in real-time.

## 🎯 Features

- **Real-time Monitoring**: Track which users are currently watching which channels
- **Auto-refresh**: Automatically updates every 10 seconds (can be toggled)
- **Connection Tracking**: Shows current connections vs max allowed connections per user
- **Stream Details**: Displays channel name, category, logo, watching duration, and IP address
- **Live Indicators**: Visual indicators for users currently streaming
- **User Status**: Shows user package, expiry date, and connection status

## 📋 Setup Instructions

### Step 1: Create the Database Table

You need to create the `active_streams` table in your Supabase database.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy and paste the following SQL:

```sql
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
```

3. Click "Run" to execute the SQL

### Step 2: Access the Feature

1. Navigate to the dashboard
2. Click on "Active Users" in the sidebar
3. You'll see a real-time view of all active users and their currently playing channels

## 🔧 How It Works

### Stream Tracking

When a user starts watching a channel:
1. The `/live/[username]/[password]/[streamId]` route is called
2. User authentication and expiry checks are performed
3. An entry is created/updated in the `active_streams` table with:
   - User information
   - Stream information
   - IP address
   - User agent
   - Timestamp

### Auto-Cleanup

- Streams are considered "active" if they've been pinged in the last 5 minutes
- Old inactive streams (>10 minutes) are automatically cleaned up on each new stream request
- This prevents the database from growing indefinitely

### Real-time Updates

The Active Users page:
- Fetches data from `/api/active-users` endpoint
- Auto-refreshes every 10 seconds (when enabled)
- Shows live indicators for users currently streaming
- Displays watching duration in real-time

## 📊 API Endpoints

### GET `/api/active-users`

Returns all active users with their currently playing channels.

**Response:**
```json
{
  "total_active_users": 4,
  "users_watching_now": 2,
  "users": [
    {
      "id": 1,
      "username": "user1",
      "max_connections": 2,
      "expire_date": "2026-12-31T00:00:00Z",
      "status": "Active",
      "package": "Premium",
      "current_connections": 1,
      "active_streams": [
        {
          "stream_id": "123",
          "stream_name": "HBO",
          "category": "Movies",
          "logo": "https://...",
          "started_at": "2026-02-08T10:30:00Z",
          "last_ping": "2026-02-08T10:35:00Z",
          "ip_address": "192.168.1.1",
          "watching_duration": 300
        }
      ]
    }
  ]
}
```

## 🎨 UI Components

### Stats Cards
- Total Active Users
- Users Watching Now
- Total Active Streams

### User Cards
Each user card shows:
- Username and live status
- Package and connection limits
- Expiry date
- Currently watching channels with:
  - Channel logo
  - Channel name and category
  - Watching duration
  - IP address
  - Live streaming indicator

### Controls
- **Auto-Refresh Toggle**: Enable/disable automatic updates
- **Manual Refresh**: Refresh data on demand

## 🔒 Security Notes

- Stream tracking doesn't interfere with authentication
- If tracking fails, the stream still works (fail-safe design)
- IP addresses are logged for monitoring purposes
- Old records are automatically cleaned up

## 🐛 Troubleshooting

### Table doesn't exist error
Run the setup SQL in Supabase SQL Editor (see Step 1)

### No active streams showing
- Make sure users are actually watching channels
- Check that the `active_streams` table exists
- Verify that streams are being accessed through the `/live/` route

### Auto-refresh not working
- Check browser console for errors
- Ensure the API endpoint is accessible
- Try manual refresh first

## 📝 Notes

- Streams are considered inactive after 5 minutes of no activity
- The system automatically cleans up streams older than 10 minutes
- Connection counting is based on unique stream_id per user
- The feature works seamlessly with existing authentication and expiry checks
