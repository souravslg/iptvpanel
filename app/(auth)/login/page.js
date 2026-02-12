'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Using 'email' field for username to match API expectation if needed, or adjust API
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-[#1a1b1e]">
            {/* Left Side - Image Placeholder */}
            <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-photo/sci-fi-metal-door-texture-background-3d-rendering_118047-9774.jpg')] bg-cover bg-center opacity-60"></div>
                {/* Fallback/Overlay if image fails or to darken */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                {/* Optional: CSS Sci-Fi Door Shape if image missing */}
                <div className="relative z-10 p-10">
                    <div className="w-64 h-64 border-4 border-blue-500/30 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-48 h-48 border-4 border-blue-500/50 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#232429]">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 mb-6 relative">
                            {/* X Logo Construction */}
                            <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                                <path d="M20,20 L40,20 L80,80 L60,80 Z" />
                                <path d="M60,20 L80,20 L40,80 L20,80 Z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-light text-white tracking-wide">Admin Panel</h2>
                        <p className="mt-2 text-sm text-gray-400">Login to access your admin dashboard</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="appearance-none rounded-md relative block w-full px-4 py-3 bg-[#2b2c31] border border-[#36373c] placeholder-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm transition-colors"
                                    placeholder="Username"
                                    autoComplete="username"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-md relative block w-full px-4 py-3 bg-[#2b2c31] border border-[#36373c] placeholder-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm transition-colors"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        {/* Click to Verify Widget Mockup */}
                        <div className="flex items-center justify-between p-3 bg-[#2b2c31] rounded border border-[#36373c] cursor-pointer hover:bg-[#323338] transition-colors group">
                            <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 rounded-sm border-2 border-gray-500 group-hover:border-gray-400"></div>
                                <span className="text-sm text-gray-300 group-hover:text-white">Click to verify</span>
                            </div>
                            <ShieldCheck className="w-5 h-5 text-gray-500" />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded hover:rounded-md text-white bg-[#f97316] hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f97316] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
