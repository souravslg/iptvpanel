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
        { name: 'Tata Play', href: '/tataplay', icon: Play },
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
        <aside className="sidebar-wrapper">
            <div className="sidebar-header">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Tv size={24} className="text-primary" />
                </div>
                <span className="sidebar-title">
                    AdminPanel
                </span>
            </div>

            <nav className="nav-container">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} style={{ marginRight: '0.75rem' }} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
