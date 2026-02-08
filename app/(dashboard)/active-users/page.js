'use client';

import { useEffect, useState } from 'react';
import { Users, Tv, Clock, Wifi, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function ActiveUsersPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchActiveUsers = async () => {
        try {
            const res = await fetch('/api/active-users');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch active users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveUsers();

        // Auto-refresh every 10 seconds if enabled
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchActiveUsers, 10000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getStatusColor = (user) => {
        if (user.current_connections > 0) {
            return 'bg-green-500/10 text-green-600 border-green-500/20';
        }
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Active Users & Live Streams</h1>
                    <p className="page-subtitle">Monitor users and their currently playing TV channels in real-time</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`btn ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        {autoRefresh ? <Eye size={18} /> : <EyeOff size={18} />}
                        {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                    </button>
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetchActiveUsers();
                        }}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {data && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="stat-card">
                        <div className="stat-top">
                            <div className="stat-icon">
                                <Users size={24} />
                            </div>
                        </div>
                        <h3 className="stat-value">{data.total_active_users}</h3>
                        <p className="stat-label">Total Active Users</p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-top">
                            <div className="stat-icon">
                                <Tv size={24} />
                            </div>
                        </div>
                        <h3 className="stat-value">{data.users_watching_now}</h3>
                        <p className="stat-label">Users Watching Now</p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-top">
                            <div className="stat-icon">
                                <Wifi size={24} />
                            </div>
                        </div>
                        <h3 className="stat-value">
                            {data.users.reduce((sum, u) => sum + u.current_connections, 0)}
                        </h3>
                        <p className="stat-label">Total Active Streams</p>
                    </div>
                </div>
            )}

            {/* Users List */}
            <div className="space-y-4">
                {loading && !data ? (
                    <div className="text-center p-12">
                        <RefreshCw size={32} className="animate-spin mx-auto text-primary mb-4" />
                        <p className="text-muted-foreground">Loading active users...</p>
                    </div>
                ) : data && data.users.length > 0 ? (
                    data.users.map((user) => (
                        <div
                            key={user.id}
                            className={`card p-6 border-2 ${getStatusColor(user)}`}
                        >
                            {/* User Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">{user.username}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.current_connections > 0
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-500 text-white'
                                            }`}>
                                            {user.current_connections > 0 ? '🔴 LIVE' : 'Idle'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        <span>📦 {user.package}</span>
                                        <span>🔌 {user.current_connections}/{user.max_connections} connections</span>
                                        <span>📅 Expires: {formatDate(user.expire_date)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active Streams */}
                            {user.active_streams.length > 0 ? (
                                <div className="space-y-3 mt-4 pt-4 border-t border-border">
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                                        Currently Watching:
                                    </h4>
                                    {user.active_streams.map((stream, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border"
                                        >
                                            {/* Channel Logo */}
                                            <div className="flex-shrink-0">
                                                {stream.logo ? (
                                                    <img
                                                        src={stream.logo}
                                                        alt={stream.stream_name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Tv size={24} className="text-primary" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stream Info */}
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-semibold text-base truncate">
                                                    {stream.stream_name}
                                                </h5>
                                                <p className="text-sm text-muted-foreground">
                                                    {stream.category}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {formatDuration(stream.watching_duration)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Wifi size={14} />
                                                        {stream.ip_address}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Live Indicator */}
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-600 rounded-lg border border-red-500/20">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs font-semibold">STREAMING</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground">
                                    No active streams
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center p-12 bg-secondary/30 rounded-xl border border-dashed border-border">
                        <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No active users found</p>
                    </div>
                )}
            </div>

            {/* Auto-refresh indicator */}
            {autoRefresh && (
                <div className="fixed bottom-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Auto-refreshing every 10s
                </div>
            )}
        </div>
    );
}
