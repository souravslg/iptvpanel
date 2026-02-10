'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileVideo, Settings, LogOut, Tv, Wifi, Activity, Play } from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Active Users', href: '/active-users', icon: Activity },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Xtream Panel', href: '/xtream', icon: Wifi },
        { name: 'Playlist', href: '/playlist', icon: FileVideo },
        { name: 'JTV Manager', href: '/jtv', icon: FileVideo },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen shrink-0 relative z-20">
            <div className="h-16 flex items-center px-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded">
                        <Tv size={20} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">SrV Creation IPTV Panel</span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-700 hover:text-red-300 transition-colors"
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
