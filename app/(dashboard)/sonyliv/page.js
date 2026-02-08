'use client';

import React, { useState, useEffect } from 'react';
import { Tv, Phone, ShieldCheck, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SonyLivPage() {
    const [status, setStatus] = useState('checking');
    const [session, setSession] = useState(null);
    const [number, setNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: number, 2: otp
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const res = await fetch('/api/sonyliv/session');
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
            const res = await fetch('/api/sonyliv/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                setMessage('OTP sent to your mobile number');
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
            const res = await fetch('/api/sonyliv/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, otp })
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
            const res = await fetch('/api/sonyliv/sync', { method: 'POST' });
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
        if (!confirm('Are you sure you want to logout from SonyLiv?')) return;
        await fetch('/api/sonyliv/session', { method: 'DELETE' });
        setSession(null);
        setStatus('disconnected');
        setStep(1);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">SonyLiv Integration</h1>
                <p className="text-gray-600">Access Sony Sports, Entertainment and News channels</p>
            </div>

            {status === 'connected' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Tv className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Account Active</h2>
                                    <p className="text-blue-100">Linked to: +91 {session.number}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <RefreshCw className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold">Sync Channels</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-6">
                                    Automatically fetch and add all SonyLiv channels to your active playlist.
                                </p>
                                <button
                                    onClick={handleSync}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Sync Now'}
                                </button>
                            </div>

                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <h3 className="font-semibold">Subscription Status</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Your session is active. DRM content will be proxied through the server.
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Premium Active
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.includes('success') || message.includes('Successfully') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium text-sm">{message}</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Tv className="w-10 h-10 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect SonyLiv</h2>
                        <p className="text-gray-500 mb-8">Login with your SonyLiv mobile number to start syncing channels.</p>

                        <form onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP} className="space-y-4">
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    placeholder="Jio Mobile Number"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    disabled={step === 2 || loading}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            {step === 2 && (
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        disabled={loading}
                                        maxLength={6}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading && <RefreshCw className="w-5 h-5 animate-spin" />}
                                {step === 1 ? 'Request OTP' : 'Verify & Connect'}
                            </button>

                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-gray-500 hover:text-blue-600 font-medium"
                                >
                                    Change Mobile Number
                                </button>
                            )}
                        </form>

                        {message && (
                            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium flex items-center justify-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                            <h4 className="font-bold text-gray-900">80+ Channels</h4>
                            <p className="text-xs text-gray-500">HD Live Streams</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 text-center">
                            <h4 className="font-bold text-gray-900">Sports & Ent</h4>
                            <p className="text-xs text-gray-500">Live & Catchup</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
