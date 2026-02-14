'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileVideo, Settings, LogOut, Tv, Wifi, Activity, Menu, X, Share2 } from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Active Users', href: '/active-users', icon: Activity },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Xtream Panel', href: '/xtream', icon: Wifi },
        { name: 'Shared Links', href: '/shared-links', icon: Share2 },
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
        <>
            {/* Mobile Header / Toggle */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 z-30 flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded">
                        <Tv size={20} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">IPTV Panel</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-300 hover:text-white rounded-md hover:bg-slate-700"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Aside */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-50
                w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen shrink-0
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-1.5 rounded">
                            <Tv size={20} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">SrV Creation</span>
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
        </>
    );
};

export default Sidebar;
