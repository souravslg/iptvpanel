# 🚀 Quick Start Guide - Active Users & Live Stream Tracking

## What You Asked For

You asked to **"show active user details with current playing tv channels details"**

## What I Built ✅

A complete real-time monitoring system that shows:
- ✅ All active users
- ✅ Which TV channels they're currently watching
- ✅ How long they've been watching
- ✅ Their connection status and limits
- ✅ IP addresses and user agents
- ✅ Beautiful, auto-refreshing dashboard

## 🎯 Quick Setup (3 Steps)

### Step 1: Create Database Table (2 minutes)

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy the contents of `SETUP_ACTIVE_STREAMS.sql` 
3. Paste and click "Run"

**That's it!** The database is ready.

### Step 2: Start Your Server

```bash
npm run dev
```

### Step 3: Access the Feature

1. Login to your admin panel
2. Click **"Active Users"** in the sidebar (new menu item)
3. See your users and their live streams!

## 📊 What You'll See

### Dashboard Stats
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Total Active Users │ Users Watching Now  │ Total Active Streams│
│         4           │         2           │         3           │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### User Cards

**Example: User Currently Watching**
```
┌────────────────────────────────────────────────────────────┐
│ 👤 john_doe                              🔴 LIVE           │
│ 📦 Premium Package | 🔌 2/2 connections                    │
│ 📅 Expires: 12/31/2026                                     │
│                                                            │
│ Currently Watching:                                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 📺 HBO                                  🔴 STREAMING  │  │
│ │ Movies                                               │  │
│ │ ⏱ 15m 30s | 📡 192.168.1.100                         │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ 📺 ESPN Sports                          🔴 STREAMING  │  │
│ │ Sports                                               │  │
│ │ ⏱ 8m 12s | 📡 192.168.1.100                          │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Example: Idle User**
```
┌────────────────────────────────────────────────────────────┐
│ 👤 jane_smith                              Idle            │
│ 📦 Basic Package | 🔌 0/1 connections                      │
│ 📅 Expires: 06/30/2026                                     │
│                                                            │
│ No active streams                                          │
└────────────────────────────────────────────────────────────┘
```

## 🎨 Features

### Auto-Refresh
- Updates every 10 seconds automatically
- Toggle on/off with a button
- Shows live indicator when active

### Live Indicators
- 🔴 Red pulsing dot for active streams
- Green border for users currently watching
- Gray border for idle users

### Detailed Information
- Channel logos (with fallback icons)
- Channel names and categories
- Watching duration (formatted)
- IP addresses
- Connection usage vs limits
- User package and expiry

### Controls
- **Auto-Refresh ON/OFF** button
- **Manual Refresh** button
- Real-time updates

## 🔧 How It Works Behind the Scenes

### When User Watches a Channel:

1. User's IPTV player requests: `/live/username/password/123.m3u8`
2. System checks authentication ✅
3. System checks expiry date ✅
4. **NEW:** System records stream activity in database
5. System redirects to actual stream URL
6. **NEW:** Old streams (>10 min) are cleaned up

### On Active Users Page:

1. Page loads
2. Fetches data from `/api/active-users`
3. Shows all active users
4. Highlights users currently watching (last 5 minutes)
5. Auto-refreshes every 10 seconds
6. Updates watching duration in real-time

## 📁 Files Created

```
panel/
├── app/
│   ├── api/
│   │   └── active-users/
│   │       └── route.js              ← API endpoint
│   ├── (dashboard)/
│   │   └── active-users/
│   │       └── page.js               ← UI page
│   └── live/[username]/[password]/[streamId]/
│       └── route.js                  ← Modified (tracking added)
├── components/
│   └── Sidebar.js                    ← Modified (menu item added)
├── SETUP_ACTIVE_STREAMS.sql          ← Database setup
├── ACTIVE_USERS_DOCUMENTATION.md     ← Full documentation
├── IMPLEMENTATION_SUMMARY.md         ← Implementation details
└── setup_active_streams.js           ← Setup helper script
```

## 🎯 Use Cases

### 1. Monitor Usage
See which channels are most popular in real-time

### 2. Track Connections
Ensure users don't exceed their connection limits

### 3. Customer Support
Help users troubleshoot streaming issues

### 4. Security
Monitor for suspicious activity (unusual IPs, etc.)

### 5. Analytics
Understand viewing patterns and peak times

## ⚡ Performance

- **Efficient queries** with proper database indexes
- **Auto-cleanup** prevents database bloat
- **Fail-safe design** - tracking won't break streaming
- **Lightweight** - minimal impact on performance

## 🔒 Security

- All existing authentication still works
- IP addresses logged for monitoring
- User agents tracked for debugging
- No sensitive data exposed

## 🎉 You're Done!

Just run the SQL setup and you're ready to go!

The feature will automatically start working as soon as users watch channels through the `/live/` route.

---

## 📞 Need Help?

Check these files:
- `ACTIVE_USERS_DOCUMENTATION.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `SETUP_ACTIVE_STREAMS.sql` - Database setup

## 🐛 Troubleshooting

**Q: No active streams showing?**
A: Make sure you ran the SQL setup in Supabase

**Q: Table doesn't exist error?**
A: Run `SETUP_ACTIVE_STREAMS.sql` in Supabase SQL Editor

**Q: Auto-refresh not working?**
A: Check browser console for errors, try manual refresh

---

**Enjoy your new real-time monitoring system! 🎬📺**
