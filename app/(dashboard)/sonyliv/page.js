'use client';

import React, { useState, useEffect } from 'react';
import { Play, User, ShieldCheck, RefreshCw, LogOut, CheckCircle2, AlertCircle, HardDrive, Smartphone } from 'lucide-react';

export default function SonyLivPage() {
    const [status, setStatus] = useState('checking');
    const [session, setSession] = useState(null);
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [useManualMode, setUseManualMode] = useState(false);
    const [manualTokens, setManualTokens] = useState({
        mobileNumber: '',
        token: '',
        userId: ''
    });

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const res = await fetch('/api/sonyliv/session');
        const data = await res.json();
        if (data.session) {
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
                body: JSON.stringify({ mobileNumber })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                setMessage(data.message || 'OTP sent successfully');
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
                body: JSON.stringify({ mobileNumber, otp })
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
        setMessage('Syncing SonyLiv channels...');
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

    const handleManualLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/sonyliv/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manualTokens)
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Successfully authenticated!');
                setTimeout(() => checkSession(), 1000);
            } else {
                setMessage(data.error || 'Failed to save session');
            }
        } catch (e) {
            setMessage('Network error occurred');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to logout from SonyLiv?')) return;
        await fetch('/api/sonyliv/session', { method: 'DELETE' });
        setSession(null);
        setStatus('disconnected');
        setStep(1);
        setUseManualMode(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">SonyLiv Integration</h1>
                <p className="text-gray-600">Sync and manage your SonyLiv Live TV channels</p>
            </div>

            {status === 'connected' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-[#2c1f3d] to-[#1a1a1a] text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                                    <Play className="w-8 h-8 text-[#ff6a00]" fill="currentColor" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Account Connected</h2>
                                    <p className="text-gray-300">Mobile: {session.number}</p>
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
                                    <RefreshCw className="w-5 h-5 text-[#ff6a00]" />
                                    <h3 className="font-semibold text-gray-800">Sync Playlist</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    Fetch SonyLiv channels and add them to the currently active playlist in the panel.
                                </p>
                                <button
                                    onClick={handleSync}
                                    disabled={loading}
                                    className="w-full py-3 bg-[#ff6a00] text-white rounded-xl font-bold shadow-md shadow-orange-100 hover:bg-[#e55f00] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
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
                                    SonyLiv session is active. Streams will be proxied with Widevine DRM headers automatically.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
                                    Active
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${message.includes('success') || message.includes('Sync') || message.includes('Synced') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium text-sm">{message}</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                        <div className="w-24 h-24 bg-[#2c1f3d] rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                            <Smartphone className="w-12 h-12 text-[#ff6a00]" />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter italic">SonyLiv</h2>
                        <p className="text-gray-500 mb-8 font-medium">Connect your account using mobile number.</p>

                        {!useManualMode ? (
                            <>
                                <form onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP} className="space-y-4 relative">
                                    <div className="relative group">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#ff6a00] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Mobile Number (91...)"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            disabled={step === 2 || loading}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff6a00] outline-none transition-all font-bold placeholder:font-medium"
                                            required
                                        />
                                    </div>

                                    {step === 2 && (
                                        <div className="relative group animate-in zoom-in-95 duration-200">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#ff6a00] transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                disabled={loading}
                                                maxLength={6}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#ff6a00] outline-none transition-all font-bold tracking-[0.5em] text-center"
                                                required
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-[#ff6a00] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-[#e55f00] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                    >
                                        {loading && <RefreshCw className="w-5 h-5 animate-spin" />}
                                        {step === 1 ? 'Get OTP' : 'Verify & Login'}
                                    </button>

                                    {step === 2 && (
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="text-sm text-gray-400 hover:text-[#ff6a00] font-bold transition-colors underline decoration-2 underline-offset-4"
                                        >
                                            Change Number
                                        </button>
                                    )}
                                </form>

                                <div className="mt-6">
                                    <button
                                        onClick={() => setUseManualMode(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                                    >
                                        Having connection issues? Use Manual Token Entry →
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                                    <h3 className="font-bold text-blue-900 mb-2 text-sm">📝 How to get your token:</h3>
                                    <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                                        <li>Open <a href="https://www.sonyliv.com" target="_blank" rel="noopener noreferrer" className="underline">www.sonyliv.com</a> in a new tab</li>
                                        <li>Login with your mobile number and OTP</li>
                                        <li>Press <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-[10px] font-mono">F12</kbd> to open DevTools</li>
                                        <li>Go to <span className="font-bold">Network</span> tab</li>
                                        <li>Refresh the page or browse channels</li>
                                        <li>Find a request to <code className="bg-blue-200 px-1 rounded">apiv2.sonyliv.com</code></li>
                                        <li>Click it, go to <span className="font-bold">Headers</span></li>
                                        <li>Copy the <code className="bg-blue-200 px-1 rounded">Authorization</code> value (JWT token)</li>
                                    </ol>
                                </div>

                                <form onSubmit={handleManualLogin} className="space-y-3 text-left">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
                                        <input
                                            type="text"
                                            placeholder="91XXXXXXXXXX"
                                            value={manualTokens.mobileNumber}
                                            onChange={(e) => setManualTokens({ ...manualTokens, mobileNumber: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#ff6a00] outline-none text-sm"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">JWT Token (from Authorization header)</label>
                                        <textarea
                                            placeholder="eyJhbGciOiJIUzI1..."
                                            value={manualTokens.token}
                                            onChange={(e) => setManualTokens({ ...manualTokens, token: e.target.value.replace('Bearer ', '') })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#ff6a00] outline-none text-xs font-mono h-20"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">User ID (optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            value={manualTokens.userId}
                                            onChange={(e) => setManualTokens({ ...manualTokens, userId: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#ff6a00] outline-none text-sm"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-[#ff6a00] text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-[#e55f00] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                        Save & Connect
                                    </button>
                                </form>

                                <div className="mt-4">
                                    <button
                                        onClick={() => setUseManualMode(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        ← Back to OTP Login
                                    </button>
                                </div>
                            </>
                        )}

                        {message && (
                            <div className={`mt-6 p-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border ${message.includes('success') || message.includes('successfully') || message.includes('Sent') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                <AlertCircle className="w-5 h-5" />
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
