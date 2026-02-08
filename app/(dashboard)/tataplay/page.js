'use client';

import React, { useState, useEffect } from 'react';
import { Play, User, ShieldCheck, RefreshCw, LogOut, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';

export default function TataPlayPage() {
    const [status, setStatus] = useState('checking');
    const [session, setSession] = useState(null);
    const [sid, setSid] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const res = await fetch('/api/tataplay/session');
        const data = await res.json();
        if (data.loggedIn) {
            setSession(data.session);
            setStatus('connected');
        } else {
            setStatus('disconnected');
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/tataplay/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                setMessage('OTP sent to your registered mobile number');
            } else {
                setMessage(data.error || 'Failed to send OTP');
            }
        } catch (e) {
            setMessage('Network error occurred');
        }
        setLoading(false);
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/tataplay/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid, otp })
            });
            const data = await res.json();
            if (data.success) {
                checkSession();
            } else {
                setMessage(data.error || 'Invalid OTP');
            }
        } catch (e) {
            setMessage('Network error occurred');
        }
        setLoading(false);
    };

    const handleSync = async () => {
        setLoading(true);
        setMessage('Syncing channels...');
        try {
            const res = await fetch('/api/tataplay/sync', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMessage(`Successfully synced ${data.count} channels!`);
            } else {
                setMessage(data.error || 'Sync failed');
            }
        } catch (e) {
            setMessage('Sync failed due to network error');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to logout from Tata Play?')) return;
        await fetch('/api/tataplay/session', { method: 'DELETE' });
        setSession(null);
        setStatus('disconnected');
        setStep(1);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tata Play Integration</h1>
                <p className="text-gray-600">Sync and manage your Tata Play subscribed channels</p>
            </div>

            {status === 'connected' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-red-600 to-rose-700 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Play className="w-8 h-8 fill-current" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Account Connected</h2>
                                    <p className="text-red-100">Subscriber ID: {session.sid}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20"
                                title="Logout"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <RefreshCw className="w-5 h-5 text-red-600" />
                                    <h3 className="font-semibold text-gray-800">Sync Playlist</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    Fetch all your subscribed channels and add them to the currently active playlist in the panel.
                                </p>
                                <button
                                    onClick={handleSync}
                                    disabled={loading}
                                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-100 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <HardDrive className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" />
                                            Update Channels
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <h3 className="font-semibold text-gray-800">Connection Status</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                    Your Tata Play session is active. Streams will be proxied with Widevine DRM headers automatically.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
                                    License Active
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${message.includes('success') || message.includes('Syncing') || message.includes('Synced') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium text-sm">{message}</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                            <Play className="w-12 h-12 text-red-600 fill-current" />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter italic">Tata Play</h2>
                        <p className="text-gray-500 mb-8 font-medium">Connect your account to fetch your channels.</p>

                        <form onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP} className="space-y-4 relative">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Subscriber ID"
                                    value={sid}
                                    onChange={(e) => setSid(e.target.value)}
                                    disabled={step === 2 || loading}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold placeholder:font-medium"
                                    required
                                />
                            </div>

                            {step === 2 && (
                                <div className="relative group animate-in zoom-in-95 duration-200">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        disabled={loading}
                                        maxLength={6}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold tracking-[0.5em] text-center"
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                            >
                                {loading && <RefreshCw className="w-5 h-5 animate-spin" />}
                                {step === 1 ? 'Get Verification Code' : 'Link Account'}
                            </button>

                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-gray-400 hover:text-red-600 font-bold transition-colors underline decoration-2 underline-offset-4"
                                >
                                    Change Subscriber ID
                                </button>
                            )}
                        </form>

                        {message && (
                            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border border-red-100">
                                <AlertCircle className="w-5 h-5" />
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white rounded-3xl border border-gray-100 text-center shadow-sm">
                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-wider mb-1">DRM Streams</h4>
                            <p className="text-[10px] text-gray-400 font-bold">Auto-licensed</p>
                        </div>
                        <div className="p-5 bg-white rounded-3xl border border-gray-100 text-center shadow-sm">
                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-wider mb-1">Active Sync</h4>
                            <p className="text-[10px] text-gray-400 font-bold">Real-time update</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
