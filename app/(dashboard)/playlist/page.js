'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, Play, List, RefreshCw, Edit, X, Save, Trash2, Plus, Trash, Link, Layers } from 'lucide-react';

export default function PlaylistPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [sample, setSample] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Edit State
    const [editingChannel, setEditingChannel] = useState(null);
    const [editUrl, setEditUrl] = useState('');
    const [editDrmScheme, setEditDrmScheme] = useState('');
    const [editDrmLicenseUrl, setEditDrmLicenseUrl] = useState('');
    const [editDrmKeyId, setEditDrmKeyId] = useState('');
    const [editDrmKey, setEditDrmKey] = useState('');
    const [editStreamFormat, setEditStreamFormat] = useState('hls');
    const [editChannelNumber, setEditChannelNumber] = useState('');
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

    // Multiple Playlists State
    const [showPlaylistsModal, setShowPlaylistsModal] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [activePlaylists, setActivePlaylists] = useState([]);
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
    const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
    const [creatingPlaylist, setCreatingPlaylist] = useState(false);
    const [switchingPlaylist, setSwitchingPlaylist] = useState(null);
    const [deletingPlaylist, setDeletingPlaylist] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPlaylistData();
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const res = await fetch('/api/playlists');
            const data = await res.json();
            setPlaylists(data.playlists || []);
            const active = data.playlists?.filter(p => p.is_active) || [];
            setActivePlaylists(active);
        } catch (err) {
            console.error('Error fetching playlists:', err);
        }
    };

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
                setActivePlaylists(data.activePlaylists || []);
                console.log('Set sample state with', data.sample?.length, 'channels');
            } else {
                setStats(null);
                setActivePlaylists([]);
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

            // Use server-side proxy to avoid CORS issues
            const proxyResponse = await fetch('/api/playlist/fetch-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: playlistUrl.trim() })
            });

            if (!proxyResponse.ok) {
                const errorData = await proxyResponse.json();
                throw new Error(errorData.error || `Failed to fetch playlist: ${proxyResponse.statusText}`);
            }

            const { content } = await proxyResponse.json();
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
        setEditUrl(channel.url || '');
        setEditDrmScheme(channel.drm_scheme || '');
        setEditDrmLicenseUrl(channel.drm_license_url || '');
        setEditDrmKeyId(channel.drm_key_id || '');
        setEditDrmKey(channel.drm_key || '');
        setEditStreamFormat(channel.stream_format || 'hls');
        setEditChannelNumber(channel.channel_number || '');
    };

    const saveEdit = async () => {
        if (!editUrl.trim()) return;
        setSaving(true);
        try {
            console.log('Sending edit request:', { id: editingChannel.id, url: editUrl, channel: editingChannel });

            const res = await fetch('/api/playlist/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingChannel.id,
                    url: editUrl,
                    drmScheme: editDrmScheme || null,
                    drmLicenseUrl: editDrmLicenseUrl || null,
                    drmKeyId: editDrmKeyId || null,
                    drmKey: editDrmKey || null,
                    streamFormat: editStreamFormat || 'hls',
                    channelNumber: editChannelNumber ? parseInt(editChannelNumber) : null
                })
            });

            const responseData = await res.json();
            console.log('Edit response:', { ok: res.ok, status: res.status, data: responseData });

            if (res.ok) {
                // Update local state to reflect change immediately
                setSample(prev => prev.map(ch => ch.id === editingChannel.id ? {
                    ...ch,
                    url: editUrl,
                    drm_scheme: editDrmScheme || null,
                    drm_license_url: editDrmLicenseUrl || null,
                    drm_key_id: editDrmKeyId || null,
                    drm_key: editDrmKey || null,
                    stream_format: editStreamFormat || 'hls',
                    channel_number: editChannelNumber ? parseInt(editChannelNumber) : null
                } : ch));
                setEditingChannel(null);
                alert('Channel updated successfully!');
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
            setAdding(false);
        }
    };

    const createPlaylist = async () => {
        if (!newPlaylistName.trim()) {
            alert('Playlist name is required');
            return;
        }

        setCreatingPlaylist(true);
        try {
            // Create the playlist
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPlaylistName.trim(),
                    description: newPlaylistDesc.trim(),
                    sourceUrl: newPlaylistUrl.trim() || null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert('Failed to create playlist: ' + (data.error || 'Unknown error'));
                setCreatingPlaylist(false);
                return;
            }

            const createdPlaylist = data.playlist;

            // If a source URL was provided, automatically import from it
            if (newPlaylistUrl.trim()) {
                try {
                    console.log('Fetching playlist from URL:', newPlaylistUrl);

                    // Use server-side proxy to avoid CORS issues
                    const proxyResponse = await fetch('/api/playlist/fetch-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: newPlaylistUrl.trim() })
                    });

                    if (!proxyResponse.ok) {
                        const errorData = await proxyResponse.json();
                        throw new Error(errorData.error || `Failed to fetch playlist: ${proxyResponse.statusText}`);
                    }

                    const { content } = await proxyResponse.json();
                    console.log('Fetched content length:', content.length);

                    // Import the content to the newly created playlist
                    const importRes = await fetch('/api/playlists/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            playlistId: createdPlaylist.id,
                            content: content,
                            sourceUrl: newPlaylistUrl.trim()
                        })
                    });

                    const importData = await importRes.json();

                    if (importRes.ok) {
                        await fetchPlaylists();
                        setShowCreatePlaylist(false);
                        setNewPlaylistName('');
                        setNewPlaylistDesc('');
                        setNewPlaylistUrl('');
                        alert(`Playlist "${newPlaylistName}" created and imported ${importData.count} channels successfully!`);
                    } else {
                        alert(`Playlist created but import failed: ${importData.error || 'Unknown error'}`);
                    }
                } catch (importError) {
                    console.error('Import error:', importError);
                    alert(`Playlist created but failed to import from URL: ${importError.message}`);
                }
            } else {
                // No URL provided, just show success
                await fetchPlaylists();
                setShowCreatePlaylist(false);
                setNewPlaylistName('');
                setNewPlaylistDesc('');
                setNewPlaylistUrl('');
                alert(`Playlist "${newPlaylistName}" created successfully!`);
            }
        } catch (error) {
            console.error('Create playlist error:', error);
            alert('Error creating playlist: ' + error.message);
        } finally {
            setCreatingPlaylist(false);
        }
    };

    const switchPlaylist = async (playlistId) => {
        setSwitchingPlaylist(playlistId);
        try {
            const res = await fetch('/api/playlists/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlistId })
            });

            const data = await res.json();

            if (res.ok) {
                await fetchPlaylists();
                await fetchPlaylistData();
                setShowPlaylistsModal(false);
                alert('Playlist switched successfully!');
            } else {
                alert('Failed to switch playlist: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Switch playlist error:', error);
            alert('Error switching playlist: ' + error.message);
        } finally {
            setSwitchingPlaylist(null);
        }
    };

    const deletePlaylist = async (playlistId, playlistName) => {
        if (!confirm(`Are you sure you want to delete the playlist "${playlistName}"? All channels in this playlist will be deleted.`)) {
            return;
        }

        setDeletingPlaylist(playlistId);
        try {
            const res = await fetch('/api/playlists', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlistId })
            });

            const data = await res.json();

            if (res.ok) {
                await fetchPlaylists();
                alert('Playlist deleted successfully!');
            } else {
                alert('Failed to delete playlist: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete playlist error:', error);
            alert('Error deleting playlist: ' + error.message);
        } finally {
            setDeletingPlaylist(null);
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
                            onClick={() => setShowPlaylistsModal(true)}
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
                            <Layers size={18} />
                            Manage Playlists
                        </button>
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
                                                                onClick={() => router.push(`/player?id=${ch.id}`)}
                                                                title="Play Channel"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}
                                                            >
                                                                <Play size={16} fill="#10b981" />
                                                            </button>
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
                        maxWidth: '42rem',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Edit Channel</h3>
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

                        {/* Channel Name (Read-only) */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Channel Name
                            </label>
                            <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#4b5563' }}>
                                {editingChannel.name}
                            </div>
                        </div>

                        {/* Stream URL */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Stream URL *
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
                                placeholder="https://..."
                            />
                        </div>

                        {/* Stream Format */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Stream Format
                            </label>
                            <select
                                value={editStreamFormat}
                                onChange={(e) => setEditStreamFormat(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="hls">HLS (.m3u8)</option>
                                <option value="mpd">MPEG-DASH (.mpd)</option>
                                <option value="rtmp">RTMP</option>
                                <option value="ts">Transport Stream (.ts)</option>
                            </select>
                        </div>

                        {/* Channel Number */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                Channel Number (Optional)
                            </label>
                            <input
                                type="number"
                                value={editChannelNumber}
                                onChange={(e) => setEditChannelNumber(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                                placeholder="e.g., 101"
                            />
                        </div>

                        {/* DRM Section */}
                        <div style={{ marginTop: '1.5rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
                                DRM Configuration (Optional)
                            </h4>

                            {/* DRM Scheme */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                    DRM Scheme
                                </label>
                                <select
                                    value={editDrmScheme}
                                    onChange={(e) => setEditDrmScheme(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="">None</option>
                                    <option value="widevine">Widevine</option>
                                    <option value="playready">PlayReady</option>
                                    <option value="fairplay">FairPlay</option>
                                    <option value="clearkey">ClearKey</option>
                                </select>
                            </div>

                            {/* DRM License URL */}
                            {editDrmScheme && editDrmScheme !== 'clearkey' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                        DRM License URL
                                    </label>
                                    <input
                                        type="text"
                                        value={editDrmLicenseUrl}
                                        onChange={(e) => setEditDrmLicenseUrl(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            outline: 'none'
                                        }}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {/* ClearKey Fields */}
                            {editDrmScheme === 'clearkey' && (
                                <>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                            Key ID
                                        </label>
                                        <input
                                            type="text"
                                            value={editDrmKeyId}
                                            onChange={(e) => setEditDrmKeyId(e.target.value)}
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
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                            Key
                                        </label>
                                        <input
                                            type="text"
                                            value={editDrmKey}
                                            onChange={(e) => setEditDrmKey(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                            placeholder="e.g., fedcba0987654321fedcba0987654321"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
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

            {/* Manage Playlists Modal */}
            {showPlaylistsModal && (
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
                        maxWidth: '48rem',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Manage Playlists</h3>
                            <button
                                onClick={() => setShowPlaylistsModal(false)}
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


                        {activePlaylists && activePlaylists.length > 0 && (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#eff6ff',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                border: '1px solid #3b82f6'
                            }}>
                                <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Active Playlist{activePlaylists.length > 1 ? 's' : ''}:
                                </div>
                                {activePlaylists.map((playlist, index) => (
                                    <div key={playlist.id} style={{
                                        fontSize: '0.75rem',
                                        color: '#3b82f6',
                                        marginTop: index > 0 ? '0.25rem' : '0',
                                        paddingLeft: '0.5rem'
                                    }}>
                                        • {playlist.name} ({playlist.total_channels} channels)
                                    </div>
                                ))}
                            </div>
                        )}


                        <button
                            onClick={() => setShowCreatePlaylist(true)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem'
                            }}
                        >
                            <Plus size={18} />
                            Create New Playlist
                        </button>

                        {showCreatePlaylist && (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                        Playlist Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newPlaylistName}
                                        onChange={(e) => setNewPlaylistName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            outline: 'none'
                                        }}
                                        placeholder="e.g., Sports Channels"
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={newPlaylistDesc}
                                        onChange={(e) => setNewPlaylistDesc(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            outline: 'none',
                                            resize: 'vertical',
                                            minHeight: '60px'
                                        }}
                                        placeholder="Brief description of this playlist"
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
                                        Source URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={newPlaylistUrl}
                                        onChange={(e) => setNewPlaylistUrl(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.875rem',
                                            outline: 'none'
                                        }}
                                        placeholder="https://example.com/playlist.m3u"
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        Enter the M3U playlist URL to import channels from
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => {
                                            setShowCreatePlaylist(false);
                                            setNewPlaylistName('');
                                            setNewPlaylistDesc('');
                                            setNewPlaylistUrl('');
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            color: '#374151',
                                            backgroundColor: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createPlaylist}
                                        disabled={creatingPlaylist}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: creatingPlaylist ? 'not-allowed' : 'pointer',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            opacity: creatingPlaylist ? 0.7 : 1
                                        }}
                                    >
                                        {creatingPlaylist ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                                        Create
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                                All Playlists ({playlists.length})
                            </h4>

                            {playlists.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                    No playlists found. Create one to get started.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {playlists.map((playlist) => (
                                        <div
                                            key={playlist.id}
                                            style={{
                                                padding: '1rem',
                                                border: playlist.is_active ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                backgroundColor: playlist.is_active ? '#eff6ff' : 'white',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937' }}>
                                                        {playlist.name}
                                                    </h5>
                                                    {playlist.is_active && (
                                                        <span style={{
                                                            padding: '0.125rem 0.5rem',
                                                            backgroundColor: '#3b82f6',
                                                            color: 'white',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600
                                                        }}>
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                {playlist.description && (
                                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                        {playlist.description}
                                                    </p>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                                    {playlist.total_channels} channels • Created {new Date(playlist.created_at).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                                <button
                                                    onClick={() => switchPlaylist(playlist.id)}
                                                    disabled={switchingPlaylist === playlist.id}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        backgroundColor: playlist.is_active ? '#ef4444' : '#10b981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '0.375rem',
                                                        cursor: switchingPlaylist === playlist.id ? 'not-allowed' : 'pointer',
                                                        fontWeight: 500,
                                                        fontSize: '0.875rem',
                                                        whiteSpace: 'nowrap',
                                                        opacity: switchingPlaylist === playlist.id ? 0.7 : 1
                                                    }}
                                                >
                                                    {switchingPlaylist === playlist.id
                                                        ? (playlist.is_active ? 'Deactivating...' : 'Activating...')
                                                        : (playlist.is_active ? 'Deactivate' : 'Activate')}
                                                </button>
                                                {!playlist.is_active && (
                                                    <button
                                                        onClick={() => deletePlaylist(playlist.id, playlist.name)}
                                                        disabled={deletingPlaylist === playlist.id}
                                                        style={{
                                                            padding: '0.5rem',
                                                            backgroundColor: 'transparent',
                                                            color: deletingPlaylist === playlist.id ? '#9ca3af' : '#ef4444',
                                                            border: 'none',
                                                            borderRadius: '0.375rem',
                                                            cursor: deletingPlaylist === playlist.id ? 'not-allowed' : 'pointer',
                                                            opacity: deletingPlaylist === playlist.id ? 0.5 : 1
                                                        }}
                                                        title="Delete Playlist"
                                                    >
                                                        {deletingPlaylist === playlist.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
