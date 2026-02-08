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
        <div className="animate-slide-up space-y-12">
            {/* Elegant Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-grad-primary p-12 text-white shadow-2xl">
                <div className="relative z-10">
                    <h1 className="text-5xl font-extrabold font-outfit tracking-tight mb-4 leading-tight">
                        Welcome back, <br />to your Strategic Portal.
                    </h1>
                    <p className="text-white/80 text-lg font-medium max-w-2xl">
                        Monitor users, manage playlists, and oversee your entire infrastructure from one central command unit.
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {statCards.map((stat) => (
                    <div key={stat.name} className="stat-card group hover:border-primary/50 transition-all duration-500">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                <stat.icon size={28} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1.5 leading-none">{stat.name}</p>
                                {loading ? (
                                    <div className="h-8 w-24 bg-white/5 animate-pulse rounded-lg"></div>
                                ) : (
                                    <h3 className="text-4xl font-extrabold font-outfit text-white group-hover:scale-105 transition-transform origin-left leading-none -translate-y-[1.5px] tracking-tight">{stat.value}</h3>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && stats.totalUsers === 0 && stats.totalStreams === 0 && (
                <div className="text-center py-20 bg-secondary/20 rounded-[2.5rem] border-2 border-dashed border-white/5 mx-auto max-w-4xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity className="text-muted-foreground opacity-30" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold font-outfit text-white mb-3">No Operational Data Found</h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">Initialize your system by onboarding users or importing your first content stream.</p>
                    <button className="btn-primary" onClick={() => window.location.href = '/users'}>Get Started Now</button>
                </div>
            )}
        </div>
    );
}
