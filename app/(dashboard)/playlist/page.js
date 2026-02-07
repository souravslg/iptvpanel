'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Play, List, RefreshCw } from 'lucide-react';

export default function PlaylistPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [sample, setSample] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPlaylistData();
    }, []);

    const fetchPlaylistData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/playlist');
            const data = await res.json();
            if (data.totalChannels > 0) {
                setStats({
                    totalChannels: data.totalChannels,
                    totalGroups: data.groups.length,
                    groups: data.groups,
                    lastUpdated: data.lastUpdated
                });
                setSample(data.sample);
            } else {
                setStats(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            setError('File too large (Max 50MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            await uploadContent(text);
        };
        reader.onerror = () => setError('Failed to read file');
        reader.readAsText(file);
    };

    const uploadContent = async (text) => {
        setUploading(true);
        setError(null);
        try {
            const res = await fetch('/api/playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text })
            });

            const data = await res.json();

            if (res.ok) {
                fetchPlaylistData();
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading playlist data...</div>;
    }

    return (
        <div>
            <div className="header-row">
                <div>
                    <h1 className="page-title">Playlist Management</h1>
                    <p className="page-subtitle">Import and manage your M3U playlists.</p>
                </div>
            </div>

            {!stats ? (
                <div style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '1rem',
                    padding: '4rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255,255,255,0.02)'
                }}>
                    <Upload size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--primary)' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload M3U Playlist</h2>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>Drag and drop or select an M3U file to start streaming.</p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                            padding: '0.75rem 2rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto'
                        }}
                    >
                        {uploading ? <RefreshCw className="animate-spin" /> : <Upload size={18} />}
                        {uploading ? 'Processing...' : 'Select File'}
                    </button>

                    <input
                        type="file"
                        accept=".m3u,.m3u8"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />

                    {error && (
                        <div style={{ marginTop: '1rem', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ width: 'fit-content' }}><List size={24} /></div>
                            <div style={{ marginTop: '1rem' }}>
                                <div className="stat-value">{stats.totalChannels.toLocaleString()}</div>
                                <div className="stat-label">Total Channels</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ width: 'fit-content', color: '#4ade80' }}><CheckCircle size={24} /></div>
                            <div style={{ marginTop: '1rem' }}>
                                <div className="stat-value">{stats.totalGroups}</div>
                                <div className="stat-label">Categories</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setStats(null)}
                            style={{
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.75rem',
                                backgroundColor: 'transparent',
                                color: 'var(--foreground)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <RefreshCw size={24} />
                            <span>Update Playlist</span>
                        </button>
                    </div>

                    <div className="split-grid">
                        <div className="stat-card">
                            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Categories</h3>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {stats.groups.map((g, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span className="truncate pr-2">{g.name}</span>
                                        <span style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{g.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="stat-card">
                            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Channel Preview (First 50)</h3>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Group</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sample.map((ch, i) => (
                                            <tr key={i}>
                                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</td>
                                                <td style={{ color: 'var(--muted-foreground)' }}>{ch.category}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
