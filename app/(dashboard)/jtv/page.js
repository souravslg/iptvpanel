
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function JTVPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/jtv/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
        } finally {
            setStatusLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/jtv/refresh', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert('Playlist updated successfully!');
                fetchStatus();
            } else {
                alert('Failed to update playlist: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error refreshing playlist:', error);
            alert('An error occurred while refreshing the playlist.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="page-header">
                <div>
                    <h1 className="page-title">JTV Playlist Manager</h1>
                    <p className="page-subtitle">Manage and auto-refresh the JTV M3U playlist</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="card p-6 border-2 border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FileText className="text-primary" />
                        Current Status
                    </h3>

                    {statusLoading ? (
                        <div className="text-center py-8">
                            <RefreshCw className="animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : status ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock size={16} /> Last Updated
                                </span>
                                <span className="font-mono font-bold text-white">
                                    {formatDate(status.lastUpdated)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock size={16} /> Next Scheduled
                                </span>
                                <span className="font-mono font-bold text-white">
                                    {status.lastUpdated ? formatDate(new Date(new Date(status.lastUpdated).getTime() + 4 * 60 * 60 * 1000).toISOString()) : 'Pending...'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <FileText size={16} /> File Size
                                </span>
                                <span className="font-mono font-bold text-white">
                                    {formatSize(status.size)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    {status.status === 'Success' ? <CheckCircle size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}
                                    Last Result
                                </span>
                                <span className={`font-bold ${status.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.status || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No status data available
                        </div>
                    )}
                </div>

                {/* Actions Card */}
                <div className="card p-6 border-2 border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <RefreshCw className="text-primary" />
                        Actions
                    </h3>

                    <div className="space-y-4">
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw />
                                    Force Refresh Now
                                </>
                            )}
                        </button>
                        <p className="text-xs text-muted-foreground text-center">
                            This process will launch a headless browser to scrape the latest playlist. It may take up to 2 minutes.
                        </p>

                        <div className="my-6 border-t border-white/10" />

                        <a
                            href="/jtv.m3u"
                            target="_blank"
                            className="w-full btn-secondary py-4 flex items-center justify-center gap-3 text-lg"
                        >
                            <Download />
                            Download Playlist
                        </a>

                        <div className="mt-4 p-4 bg-black/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-2">Public URL:</p>
                            <code className="block w-full p-2 bg-black/40 rounded text-xs break-all font-mono select-all">
                                {typeof window !== 'undefined' ? `${window.location.origin}/jtv.m3u` : '/jtv.m3u'}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
