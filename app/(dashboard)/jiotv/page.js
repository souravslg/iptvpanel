'use client';

import { useState, useEffect } from 'react';
import {
    Server, RefreshCw, CheckCircle, AlertCircle, Wifi,
    Clock, Tv, Settings, ExternalLink, Play, Globe, Zap
} from 'lucide-react';

const PUBLIC_JIOTV_M3U = 'https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u';

export default function JioTVServerPage() {
    const [serverUrl, setServerUrl] = useState('');
    const [quality, setQuality] = useState('auto');
    const [language, setLanguage] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [publicSyncing, setPublicSyncing] = useState(false);
    const [config, setConfig] = useState(null);
    const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text }
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/jiotv');
            const data = await res.json();
            if (data.config) {
                setConfig(data.config);
                setServerUrl(data.config.serverUrl || '');
                setQuality(data.config.quality || 'auto');
                setLanguage(data.config.language || '');
            }
        } catch (e) {
            console.error('Failed to load config:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndSync = async () => {
        if (!serverUrl.trim()) {
            setStatusMsg({ type: 'error', text: 'Please enter a valid JioTV server URL.' });
            return;
        }
        setSyncing(true);
        setStatusMsg(null);
        setTestResult(null);
        try {
            const res = await fetch('/api/jiotv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverUrl, quality, language })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStatusMsg({ type: 'success', text: `✅ Synced ${data.count} channels successfully!` });
                loadConfig();
            } else {
                setStatusMsg({ type: 'error', text: data.error || 'Sync failed. Check server URL.' });
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: 'Network error: ' + e.message });
        } finally {
            setSyncing(false);
        }
    };

    const handleQuickSync = async () => {
        setSyncing(true);
        setStatusMsg(null);
        try {
            const res = await fetch('/api/jiotv/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            const data = await res.json();
            if (res.ok && data.success) {
                setStatusMsg({ type: 'success', text: `✅ Re-synced ${data.count} channels!` });
                loadConfig();
            } else {
                setStatusMsg({ type: 'error', text: data.error || 'Sync failed' });
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: e.message });
        } finally {
            setSyncing(false);
        }
    };

    const handlePublicSync = async () => {
        setPublicSyncing(true);
        setStatusMsg(null);
        try {
            const res = await fetch('/api/jiotv/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ m3uUrl: PUBLIC_JIOTV_M3U, serverUrl: 'Public GitHub' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStatusMsg({ type: 'success', text: `✅ Synced ${data.count} JioTV channels from public source!` });
                loadConfig();
            } else {
                setStatusMsg({ type: 'error', text: data.error || 'Public sync failed' });
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: e.message });
        } finally {
            setPublicSyncing(false);
        }
    };

    const handleTestConnection = async () => {
        if (!serverUrl.trim()) return;
        setTestLoading(true);
        setTestResult(null);
        try {
            const params = new URLSearchParams();
            if (quality && quality !== 'auto') params.set('q', quality);
            const testUrl = `${serverUrl.trim().replace(/\/$/, '')}/playlist.m3u${params.toString() ? '?' + params.toString() : ''}`;
            const res = await fetch('/api/playlist/fetch-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: testUrl })
            });
            const data = await res.json();
            if (res.ok && data.content) {
                const lines = data.content.split('\n');
                const channelCount = lines.filter(l => l.startsWith('#EXTINF')).length;
                setTestResult({ success: true, text: `✅ Connected! Found ${channelCount} channels in M3U response.` });
            } else {
                setTestResult({ success: false, text: `❌ Could not reach server. Check URL and ensure JioTV server is running.` });
            }
        } catch (e) {
            setTestResult({ success: false, text: `❌ Error: ${e.message}` });
        } finally {
            setTestLoading(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Never';

    const buildM3UPreview = () => {
        if (!serverUrl.trim()) return '';
        const params = new URLSearchParams();
        if (quality && quality !== 'auto') params.set('q', quality);
        if (language?.trim()) params.set('l', language.trim());
        const base = serverUrl.trim().replace(/\/$/, '');
        return `${base}/playlist.m3u${params.toString() ? '?' + params.toString() : ''}`;
    };

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <Server className="text-primary" size={28} />
                        JioTV Server
                    </h1>
                    <p className="page-subtitle">
                        Connect a self-hosted JioTV proxy server (jiotv_go, etc.) and sync its channels into your playlist.
                    </p>
                </div>
            </div>

            {/* ✅ Public M3U Banner */}
            <div className="card p-5 border-2 border-green-500/20 bg-green-500/5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Globe className="text-green-400 mt-0.5 shrink-0" size={22} />
                        <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                                Recommended: Public JioTV Playlist
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-normal">Works Everywhere</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Self-hosted servers outside India are geo-blocked by JioTV CDN (451 error).
                                Use the free public playlist instead — no server needed, always working.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handlePublicSync}
                        disabled={publicSyncing}
                        className="btn-primary flex items-center gap-2 px-5 py-3 shrink-0"
                    >
                        {publicSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
                        {publicSyncing ? 'Syncing...' : 'Use Public JioTV M3U'}
                    </button>
                </div>
                {statusMsg && (
                    <div className={`flex items-center gap-3 mt-4 p-3 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {statusMsg.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Config Card */}
                <div className="lg:col-span-2 card p-6 border-2 border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Settings className="text-primary" size={20} />
                        Self-Hosted Server (Indian IP Required)
                    </h3>

                    <div className="space-y-5">
                        {/* Server URL */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                JioTV Server URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="url"
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                                placeholder="http://192.168.1.10:5001"
                                value={serverUrl}
                                onChange={e => setServerUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Base URL of your running JioTV server. Do not include a trailing slash.
                            </p>
                        </div>

                        {/* Quality */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Stream Quality</label>
                            <select
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                                value={quality}
                                onChange={e => setQuality(e.target.value)}
                            >
                                <option value="auto">Auto (Server Default)</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* Language Filter */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Language Filter <span className="text-muted-foreground font-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                                placeholder="Hindi,English,Tamil"
                                value={language}
                                onChange={e => setLanguage(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Comma-separated language names to filter channels (e.g. Hindi,English,Tamil).
                            </p>
                        </div>

                        {/* M3U URL Preview */}
                        {serverUrl.trim() && (
                            <div className="p-4 bg-black/20 rounded-xl">
                                <p className="text-xs text-muted-foreground mb-2 font-medium">M3U Endpoint Preview:</p>
                                <code className="block text-xs font-mono text-green-400 break-all select-all">
                                    {buildM3UPreview()}
                                </code>
                            </div>
                        )}

                        {/* Status Message */}
                        {statusMsg && (
                            <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {statusMsg.text}
                            </div>
                        )}

                        {/* Test Connection Result */}
                        {testResult && (
                            <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${testResult.success ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                <Wifi size={18} />
                                {testResult.text}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                onClick={handleTestConnection}
                                disabled={testLoading || !serverUrl.trim()}
                                className="btn-secondary flex items-center gap-2 px-5 py-3"
                            >
                                {testLoading ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
                                {testLoading ? 'Testing...' : 'Test Connection'}
                            </button>

                            <button
                                onClick={handleSaveAndSync}
                                disabled={syncing || !serverUrl.trim()}
                                className="btn-primary flex items-center gap-2 px-6 py-3"
                            >
                                {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Server size={16} />}
                                {syncing ? 'Saving & Syncing...' : 'Save & Sync Channels'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Card */}
                <div className="space-y-4">
                    <div className="card p-6 border-2 border-white/5">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Tv className="text-primary" size={18} />
                            Sync Status
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-6">
                                <RefreshCw className="animate-spin text-muted-foreground" />
                            </div>
                        ) : config ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Server URL</p>
                                    <p className="text-sm font-mono text-white break-all">{config.serverUrl}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock size={12} /> Last Synced</p>
                                    <p className="text-sm font-bold text-white">{formatDate(config.lastSyncedAt)}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Channels Synced</p>
                                    <p className="text-2xl font-bold text-primary">{config.lastSyncCount ?? '—'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Quality</p>
                                    <p className="text-sm font-bold text-white capitalize">{config.quality || 'Auto'}</p>
                                </div>

                                {config.lastSyncedAt && (
                                    <button
                                        onClick={handleQuickSync}
                                        disabled={syncing}
                                        className="w-full btn-secondary flex items-center justify-center gap-2 py-3 mt-2"
                                    >
                                        {syncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                        {syncing ? 'Syncing...' : 'Re-Sync Now'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                <Server size={32} className="mx-auto mb-3 opacity-30" />
                                No server configured yet.
                            </div>
                        )}
                    </div>

                    {/* Help Card */}
                    <div className="card p-5 border-2 border-white/5">
                        <h4 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">Quick Guide</h4>
                        <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Install <span className="text-primary font-mono">jiotv_go</span> on your device</li>
                            <li>Start the server on port <span className="font-mono">5001</span></li>
                            <li>Enter the server URL above</li>
                            <li>Click <strong className="text-white">Save &amp; Sync</strong></li>
                            <li>Enable the playlist in <a href="/playlist" className="text-primary underline">Playlist Manager</a></li>
                        </ol>
                        <a
                            href="https://github.com/rabilrbl/jiotv_go"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                            <ExternalLink size={12} />
                            jiotv_go on GitHub
                        </a>
                    </div>
                </div>
            </div>

            {/* Go to Playlist Manager */}
            {config?.lastSyncCount > 0 && (
                <div className="card p-5 border-2 border-green-500/20 bg-green-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-400" size={22} />
                        <div>
                            <p className="font-semibold text-white">JioTV playlist is ready!</p>
                            <p className="text-sm text-muted-foreground">Go to Playlist Manager to activate it for your users.</p>
                        </div>
                    </div>
                    <a href="/playlist" className="btn-primary flex items-center gap-2 px-5 py-2.5">
                        <Play size={16} /> Open Playlist Manager
                    </a>
                </div>
            )}
        </div>
    );
}
