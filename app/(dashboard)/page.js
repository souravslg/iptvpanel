'use client';

import { useEffect, useState } from 'react';
import { Users, Play, Activity } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalStreams: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue' },
        { name: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'text-green' },
        { name: 'Playlist Items', value: stats.totalStreams, icon: Play, color: 'text-yellow' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="page-subtitle">Manage your IPTV infrastructure efficiently.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat) => (
                    <div key={stat.name} className="stat-card">
                        <div className="stat-top">
                            <div className="stat-icon">
                                <stat.icon size={24} />
                            </div>
                        </div>
                        {loading ? (
                            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                            <h3 className="stat-value">{stat.value}</h3>
                        )}
                        <p className="stat-label">{stat.name}</p>
                    </div>
                ))}
            </div>

            {!loading && stats.totalUsers === 0 && stats.totalStreams === 0 && (
                <div className="text-center p-12 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border">
                    <p>No data available yet. Start by adding users or uploading a playlist.</p>
                </div>
            )}
        </div>
    );
}
