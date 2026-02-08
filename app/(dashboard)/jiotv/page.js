'use client';

import React, { useState, useEffect } from 'react';
import { Tv, Phone, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function JioTVPage() {
    const [step, setStep] = useState(1); // 1: Login, 2: OTP, 3: Dashboard
    const [number, setNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [session, setSession] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const res = await fetch('/api/jiotv/session');
            const data = await res.json();
            if (data.session) {
                setSession(data.session);
                setStep(3);
            }
        } catch (e) { }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/jiotv/otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/jiotv/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, otp })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStep(3);
            checkSession();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setSyncMsg('Syncing 800+ channels... please wait');
        try {
            const res = await fetch('/api/jiotv/sync', { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSyncMsg(`Success! ${data.count} channels imported.`);
        } catch (err) {
            setSyncMsg(`Sync failed: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const logout = async () => {
        // Simple setting clear
        setStep(1);
        setSession(null);
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="header-info">
                    <h1 className="page-title">JioTV+ Integration</h1>
                    <p className="page-subtitle">Access 800+ Live Channels directly</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Status Card */}
                <div className="settings-card">
                    <div className="card-header border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Tv size={24} />
                            </div>
                            <h3 className="card-title">JioTV Status</h3>
                        </div>
                        {session && (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                <CheckCircle2 size={16} /> Connected
                            </span>
                        )}
                    </div>

                    <div className="card-body p-6">
                        {step === 1 && (
                            <form onSubmit={handleRequestOTP} className="space-y-4">
                                <div className="form-group">
                                    <label className="input-label">Jio Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Phone size={18} />
                                        </div>
                                        <input
                                            type="tel"
                                            className="form-input pl-10"
                                            placeholder="10 digit mobile number"
                                            value={number}
                                            onChange={(e) => setNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                                    {loading ? 'Processing...' : 'Request OTP'}
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <div className="form-group">
                                    <label className="input-label">Enter OTP</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            className="form-input pl-10"
                                            placeholder="XXXXXX"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Check your mobile for the OTP sent from Jio</p>
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary w-full">
                                    {loading ? 'Verifying...' : 'Verify & Setup'}
                                </button>
                                <button type="button" onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline block text-center w-full">Change number</button>
                            </form>
                        )}

                        {step === 3 && session && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-500">Connected Number</span>
                                        <span className="font-semibold">{session.number}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Last Synced</span>
                                        <span className="text-sm">{session.lastUpdated ? new Date(session.lastUpdated).toLocaleString() : 'Never'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={handleSync} disabled={syncing} className="btn btn-primary flex items-center justify-center gap-2">
                                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                                        {syncing ? 'Syncing...' : 'Sync Channels Now'}
                                    </button>
                                    <button onClick={logout} className="text-red-600 text-sm font-medium hover:underline">Logout from JioTV</button>
                                </div>
                                {syncMsg && <p className={`text-sm text-center ${syncMsg.includes('Success') ? 'text-green-600' : 'text-blue-600'}`}>{syncMsg}</p>}
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm">
                                <AlertCircle size={16} className="mt-0.5" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Unlimited Entertainment</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="p-1 bg-white/20 rounded-full h-fit"><CheckCircle2 size={16} /></div>
                                <span>800+ Live Channels automatically added</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="p-1 bg-white/20 rounded-full h-fit"><CheckCircle2 size={16} /></div>
                                <span>HD Streams with Multi-Language Support</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="p-1 bg-white/20 rounded-full h-fit"><CheckCircle2 size={16} /></div>
                                <span>No external server required</span>
                            </li>
                        </ul>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-blue-100 text-sm">
                            This integration uses your existing Jio subscription. Ensure your SIM is active for the best experience.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
