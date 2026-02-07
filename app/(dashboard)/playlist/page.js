'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Play, List, RefreshCw, Edit, X, Save, Trash2, Plus, Trash, Link } from 'lucide-react';

export default function PlaylistPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [sample, setSample] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Edit State
    const [editingChannel, setEditingChannel] = useState(null);
    const [editUrl, setEditUrl] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete State
    const [deleting, setDeleting] = useState(null);

    // Add Channel State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newChannel, setNewChannel] = useState({
        name: '',
        url: '',
        category: '',
        logo: '',
        channelNumber: '',
        streamFormat: 'hls',
        drmScheme: '',
        drmLicenseUrl: '',
        drmKeyId: '',
        drmKey: ''
    });
    const [adding, setAdding] = useState(false);

    // Clear Playlist State
    const [clearing, setClearing] = useState(false);

    // URL Import State
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [fetchingUrl, setFetchingUrl] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPlaylistData();
    }, []);

    const fetchPlaylistData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/playlist');
            const data = await res.json();
            console.log('Fetched playlist data:', data);
            console.log('Sample length:', data.sample?.length);
            if (data.totalChannels > 0) {
                setStats({
                    totalChannels: data.totalChannels,
                    totalGroups: data.groups.length,
                    groups: data.groups,
                    lastUpdated: data.lastUpdated
                });
                setSample(data.sample);
                console.log('Set sample state with', data.sample?.length, 'channels');
            } else {
                setStats(null);
                console.log('No channels found');
            }
        } catch (err) {
            console.error('Error fetching playlist:', err);
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

    const importFromUrl = async () => {
        if (!playlistUrl.trim()) {
            alert('Please enter a valid URL');
            return;
        }

        setFetchingUrl(true);
        setError(null);
        try {
            console.log('Fetching playlist from URL:', playlistUrl);

            // Fetch the M3U content from the URL
            const response = await fetch(playlistUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            }

            const content = await response.text();
            console.log('Fetched content length:', content.length);

            // Upload the content
            await uploadContent(content);

            setShowUrlModal(false);
            setPlaylistUrl('');
            alert('Playlist imported successfully from URL!');
        } catch (err) {
            console.error('URL import error:', err);
            setError('Failed to import from URL: ' + err.message);
            alert('Failed to import from URL: ' + err.message);
        } finally {
            setFetchingUrl(false);
        }
    };

    const startEditing = (channel) => {
        setEditingChannel(channel);
        setEditUrl(channel.url);
    };

    const saveEdit = async () => {
        if (!editUrl.trim()) return;
        setSaving(true);
        try {
            console.log('Sending edit request:', { id: editingChannel.id, url: editUrl, channel: editingChannel });

            const res = await fetch('/api/playlist/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingChannel.id, url: editUrl })
            });

            const responseData = await res.json();
            console.log('Edit response:', { ok: res.ok, status: res.status, data: responseData });

            if (res.ok) {
                // Update local state to reflect change immediately
                setSample(prev => prev.map(ch => ch.id === editingChannel.id ? { ...ch, url: editUrl } : ch));
                setEditingChannel(null);
                alert('URL updated successfully!');
            } else {
                console.error('Edit failed:', responseData);
                alert('Failed to update URL: ' + (responseData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Edit error:', error);
            alert('Error updating URL: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteChannel = async (channel) => {
        if (!confirm(`Are you sure you want to delete "${channel.name}"?`)) {
            return;
        }

        setDeleting(channel.id);
        try {
            console.log('Sending delete request:', { id: channel.id, channel });

            const res = await fetch('/api/playlist/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: channel.id })
            });

            const responseData = await res.json();
            console.log('Delete response:', { ok: res.ok, status: res.status, data: responseData });

            if (res.ok) {
                // Remove from local state
                setSample(prev => prev.filter(ch => ch.id !== channel.id));
                // Update total count
                if (stats) {
                    setStats(prev => ({ ...prev, totalChannels: prev.totalChannels - 1 }));
                }
                alert('Channel deleted successfully!');
            } else {
                console.error('Delete failed:', responseData);
                alert('Failed to delete channel: ' + (responseData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting channel: ' + error.message);
        } finally {
            setDeleting(null);
        }
    };

    const addChannel = async () => {
        if (!newChannel.name.trim() || !newChannel.url.trim()) {
            alert('Name and URL are required');
            return;
        }

        setAdding(true);
        try {
            console.log('Sending add channel request:', newChannel);

            const res = await fetch('/api/playlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChannel)
            });

            const responseData = await res.json();
            console.log('Add channel response:', { ok: res.ok, status: res.status, data: responseData });

            if (res.ok) {
                // Add to local state
                setSample(prev => [responseData.data, ...prev]);
                // Update total count
                if (stats) {
                    setStats(prev => ({ ...prev, totalChannels: prev.totalChannels + 1 }));
                } else {
                    // If no stats, fetch fresh data
                    fetchPlaylistData();
                }
                setShowAddModal(false);
                setNewChannel({ name: '', url: '', category: '', logo: '', channelNumber: '', streamFormat: 'hls', drmScheme: '', drmLicenseUrl: '', drmKeyId: '', drmKey: '' });
                alert('Channel added successfully!');
            } else {
                console.error('Add failed:', responseData);
                alert('Failed to add channel: ' + (responseData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Add error:', error);
            alert('Error adding channel: ' + error.message);
        } finally {
            setAdding(false);
        }
    };

    const clearPlaylist = async () => {
        if (!confirm('Are you sure you want to delete the ENTIRE playlist? This action cannot be undone!')) {
            return;
        }

        setClearing(true);
        try {
            console.log('Sending clear playlist request');

            const res = await fetch('/api/playlist/clear', {
                method: 'DELETE'
            });

            const responseData = await res.json();
            console.log('Clear playlist response:', { ok: res.ok, status: res.status, data: responseData });

            if (res.ok) {
                // Reset state
                setStats(null);
                setSample([]);
                alert('Playlist cleared successfully!');
            } else {
                console.error('Clear failed:', responseData);
                alert('Failed to clear playlist: ' + (responseData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Clear error:', error);
            alert('Error clearing playlist: ' + error.message);
        } finally {
            setClearing(false);
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
                {stats && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={18} />
                            Add Channel
                        </button>
                        <button
                            onClick={clearPlaylist}
                            disabled={clearing}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: clearing ? '#9ca3af' : '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: clearing ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: clearing ? 0.7 : 1
                            }}
                        >
                            {clearing ? <RefreshCw size={18} className="animate-spin" /> : <Trash size={18} />}
                            Clear Playlist
                        </button>
                    </div>
                )}
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
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>Upload a file or import from URL to start streaming.</p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: uploading ? 0.7 : 1
                            }}
                        >
                            {uploading ? <RefreshCw className="animate-spin" /> : <Upload size={18} />}
                            {uploading ? 'Processing...' : 'Select File'}
                        </button>

                        <button
                            onClick={() => setShowUrlModal(true)}
                            disabled={uploading}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: 'transparent',
                                color: 'var(--primary)',
                                border: '2px solid var(--primary)',
                                borderRadius: '0.5rem',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: uploading ? 0.7 : 1
                            }}
                        >
                            <Link size={18} />
                            Import from URL
                        </button>
                    </div>

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
                            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Channel List ({stats.totalChannels} Channels)</h3>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Group</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {console.log('Rendering channels, sample:', sample, 'length:', sample?.length)}
                                        {sample && sample.length > 0 ? (
                                            sample.map((ch, i) => (
                                                <tr key={i}>
                                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</td>
                                                    <td style={{ color: 'var(--muted-foreground)' }}>{ch.category}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <button
                                                                onClick={() => startEditing(ch)}
                                                                title="Edit URL"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteChannel(ch)}
                                                                title="Delete Channel"
                                                                disabled={deleting === ch.id}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: deleting === ch.id ? 'not-allowed' : 'pointer',
                                                                    color: deleting === ch.id ? '#9ca3af' : '#ef4444',
                                                                    opacity: deleting === ch.id ? 0.5 : 1
                                                                }}
                                                            >
                                                                {deleting === ch.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                                    No channels to display. Check browser console for errors.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingChannel && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '28rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>Edit Stream URL</h3>
                            <button
                                onClick={() => setEditingChannel(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.25rem'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Channel Name
                            </label>
                            <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#4b5563' }}>
                                {editingChannel.name}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Stream URL
                            </label>
                            <input
                                type="text"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="http://..."
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => setEditingChannel(null)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    color: '#374151',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={saving}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Channel Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '32rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>Add New Channel</h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewChannel({ name: '', url: '', category: '', logo: '', channelNumber: '', streamFormat: 'hls', drmScheme: '', drmLicenseUrl: '', drmKeyId: '', drmKey: '' });
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.25rem'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Channel Name *
                            </label>
                            <input
                                type="text"
                                value={newChannel.name}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="e.g., Colors Bangla HD"
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Stream URL *
                            </label>
                            <input
                                type="text"
                                value={newChannel.url}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, url: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="http://..."
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Category
                            </label>
                            <input
                                type="text"
                                value={newChannel.category}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, category: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="e.g., TV, Movies, Sports"
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Logo URL
                            </label>
                            <input
                                type="text"
                                value={newChannel.logo}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, logo: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="http://..."
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Channel Number (Optional)
                            </label>
                            <input
                                type="number"
                                value={newChannel.channelNumber}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, channelNumber: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="e.g., 101"
                                min="1"
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Set a custom channel number for ordering
                            </p>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Stream Format
                            </label>
                            <select
                                value={newChannel.streamFormat}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, streamFormat: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    backgroundColor: 'white'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            >
                                <option value="hls">HLS (.m3u8)</option>
                                <option value="mpd">DASH/MPD (.mpd)</option>
                                <option value="ts">MPEG-TS (.ts)</option>
                                <option value="rtmp">RTMP</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                DRM Scheme (Optional)
                            </label>
                            <select
                                value={newChannel.drmScheme}
                                onChange={(e) => setNewChannel(prev => ({ ...prev, drmScheme: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    backgroundColor: 'white'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            >
                                <option value="">None</option>
                                <option value="widevine">Widevine</option>
                                <option value="playready">PlayReady</option>
                                <option value="fairplay">FairPlay</option>
                                <option value="clearkey">ClearKey</option>
                            </select>
                        </div>

                        {newChannel.drmScheme && newChannel.drmScheme !== '' && (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                        DRM License URL
                                    </label>
                                    <input
                                        type="text"
                                        value={newChannel.drmLicenseUrl}
                                        onChange={(e) => setNewChannel(prev => ({ ...prev, drmLicenseUrl: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            outline: 'none'
                                        }}
                                        placeholder="https://license-server.com/..."
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    />
                                </div>

                                {newChannel.drmScheme === 'clearkey' && (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                                ClearKey Key ID
                                            </label>
                                            <input
                                                type="text"
                                                value={newChannel.drmKeyId}
                                                onChange={(e) => setNewChannel(prev => ({ ...prev, drmKeyId: e.target.value }))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.875rem',
                                                    outline: 'none',
                                                    fontFamily: 'monospace'
                                                }}
                                                placeholder="e.g., 1234567890abcdef1234567890abcdef"
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                                ClearKey Key
                                            </label>
                                            <input
                                                type="text"
                                                value={newChannel.drmKey}
                                                onChange={(e) => setNewChannel(prev => ({ ...prev, drmKey: e.target.value }))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.875rem',
                                                    outline: 'none',
                                                    fontFamily: 'monospace'
                                                }}
                                                placeholder="e.g., abcdef1234567890abcdef1234567890"
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewChannel({ name: '', url: '', category: '', logo: '', channelNumber: '', streamFormat: 'hls', drmScheme: '', drmLicenseUrl: '', drmKeyId: '', drmKey: '' });
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    color: '#374151',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addChannel}
                                disabled={adding}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: adding ? 'not-allowed' : 'pointer',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: adding ? 0.7 : 1
                                }}
                            >
                                {adding ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                                Add Channel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* URL Import Modal */}
            {showUrlModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '32rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>Import Playlist from URL</h3>
                            <button
                                onClick={() => {
                                    setShowUrlModal(false);
                                    setPlaylistUrl('');
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.25rem'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Playlist URL
                            </label>
                            <input
                                type="url"
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="https://example.com/playlist.m3u"
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                Enter the direct URL to an M3U or M3U8 playlist file
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => {
                                    setShowUrlModal(false);
                                    setPlaylistUrl('');
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    color: '#374151',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={importFromUrl}
                                disabled={fetchingUrl}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    cursor: fetchingUrl ? 'not-allowed' : 'pointer',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: fetchingUrl ? 0.7 : 1
                                }}
                            >
                                {fetchingUrl ? <RefreshCw size={16} className="animate-spin" /> : <Link size={16} />}
                                {fetchingUrl ? 'Importing...' : 'Import Playlist'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
