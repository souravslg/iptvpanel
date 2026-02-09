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
        <div className="flex min-h-screen items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,var(--primary-glow),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.05),transparent_50%)]">
            <div className="w-full max-w-[480px] animate-slide-up">
                <div className="glass-panel p-10 md:p-12 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                    {/* Branding */}
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className="w-16 h-16 bg-grad-primary rounded-[1.25rem] flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
                            <Box size={32} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl font-bold font-outfit tracking-tighter text-white mb-2">
                            SRV <span className="text-primary">CORE</span>
                        </h1>
                        <p className="text-muted-foreground font-medium">Elevate your streaming ecosystem.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm flex items-center gap-3 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">
                                    Identity Profile
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 bg-black/20 border-white/5 focus:bg-black/40 focus:border-primary/50"
                                        placeholder="Enter administrator email"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] ml-1">
                                    Security Protocol
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 bg-black/20 border-white/5 focus:bg-black/40 focus:border-primary/50"
                                        placeholder="Enter access key"
                                        required
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Initialize Portal</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 group-hover:scale-150 transition-all" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
                            Enterprise Grade Security • 2026 SRV CORE
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
