'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Box } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
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
        <div className="flex min-h-screen flex-col lg:flex-row bg-white">
            {/* Left Panel - Branding (Top on mobile, Left on desktop) */}
            <div className="lg:w-1/2 w-full bg-[#105e36] text-white flex flex-col justify-between p-8 lg:p-16 relative overflow-hidden">
                {/* Background Pattern/Texture (Optional subtle gradient) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#105e36] to-[#064e2b] opacity-100 z-0"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8 lg:mb-0">
                        <div className="bg-white/90 p-1.5 rounded-md shadow-sm">
                            <Box size={24} className="text-[#105e36]" strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">
                            Content<span className="text-[#4ade80]">Panel</span>
                        </span>
                    </div>

                    {/* Quote Section (Hidden on small mobile screens to save space if needed, or kept) */}
                    <div className="max-w-xl hidden md:block">
                        <blockquote className="text-2xl lg:text-[2.2rem] font-serif leading-tight mb-6 text-white/95">
                            “Take care of your body. It's the only place you have to live.”
                        </blockquote>
                        <p className="text-[#86efac] font-medium text-lg">Jim Rohn</p>
                    </div>

                    {/* Footer */}
                    <div className="text-[#86efac]/60 text-sm mt-8 lg:mt-0">
                        © 2026 Content Panel Inc.
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-6 lg:p-12 bg-white">
                <div className="w-full max-w-[420px]">

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Admin Panel</h2>
                        <p className="text-gray-500 text-sm lg:text-base">Enter your credentials to access the dashboard</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#16a34a] transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#16a34a] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Cloudflare Verification Simulation Removed */}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
