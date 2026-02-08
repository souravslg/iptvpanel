'use client';

import React, { useState, useEffect } from 'react';
import { Tv, RefreshCw, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Zee5Page() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState({ count: 0 });

    const handleSync = async () => {
        setLoading(true);
        setMessage('Fetching and syncing Zee5 channels...');
        try {
            const res = await fetch('/api/zee5/sync', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setMessage(`Successfully synced ${data.count} Zee5 channels!`);
                setStats({ count: data.count });
            } else {
                setMessage(data.error || 'Sync failed');
            }
        } catch (e) {
            setMessage('Sync failed due to network error');
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Zee5 Integration</h1>
                <p className="text-gray-600">Sync channels from external Zee5 PHP source</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-[#8230c6] to-[#5a1a91] text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                <Tv className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Zee5 Source Connected</h2>
                                <p className="text-purple-100">Direct PHP Playlist Integration</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <RefreshCw className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-800">Sync Playlist</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                Automatically fetch channels from the Zee5 PHP server and add them to your active playlist.
                            </p>
                            <button
                                onClick={handleSync}
                                disabled={loading}
                                className="w-full py-3 bg-[#8230c6] text-white rounded-xl font-bold shadow-md shadow-purple-100 hover:bg-[#7025ac] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
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
                                <h3 className="font-semibold text-gray-800">Source Status</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                The Zee5 PHP source is active. Channels will be imported with their specific User-Agent headers.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
                                Online
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${message.includes('success') || message.includes('Synced') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium text-sm">{message}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-purple-50 rounded-2xl p-6 border border-purple-100 text-sm text-purple-800">
                <h4 className="font-bold mb-2">Playlist URL Summary:</h4>
                <code>http://hcw08a7zgsj.sn.mynetname.net:3001/zee5/playlist.php</code>
                <p className="mt-2 text-xs">This source provides live TV streams with custom User-Agent authentication.</p>
            </div>
        </div>
    );
}
