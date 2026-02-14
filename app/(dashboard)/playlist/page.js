'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload, FileText, CheckCircle, AlertCircle, Play, List, RefreshCw,
    Edit, X, Save, Trash2, Plus, Link, Layers, Search,
    Activity, Signal, Globe, Lock, Tv, MoreHorizontal, Power
} from 'lucide-react';

export default function PlaylistPage() {
    const router = useRouter();
    console.log('PlaylistPage rendering');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [sample, setSample] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'enabled', 'disabled'

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

    // Toggle Status State
    const [toggling, setToggling] = useState(null);

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
    const [refreshingPlaylist, setRefreshingPlaylist] = useState(null);
    const [editingPlaylist, setEditingPlaylist] = useState(null);
    const [editPlaylistName, setEditPlaylistName] = useState('');
    const [editPlaylistDesc, setEditPlaylistDesc] = useState('');
    const [editPlaylistUrl, setEditPlaylistUrl] = useState('');
    const [updatingPlaylist, setUpdatingPlaylist] = useState(false);

    // File upload for playlist creation
    const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'
    const [uploadedFile, setUploadedFile] = useState(null);
    const playlistFileRef = useRef(null);

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
            if (data.totalChannels > 0) {
                setStats({
                    totalChannels: data.totalChannels,
                    totalGroups: data.groups.length,
                    groups: data.groups,
                    lastUpdated: data.lastUpdated
                });
                setSample(data.sample);
                setActivePlaylists(data.activePlaylists || []);
            } else {
                setStats(null);
                setActivePlaylists([]);
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

        const reader = new FileReader();
        reader.onload = async (e) => {
            await uploadContent(e.target.result);
        };
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

            if (res.ok) {
                fetchPlaylistData();
            } else {
                setError('Upload failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const importFromUrl = async () => {
        if (!playlistUrl.trim()) return;
        setFetchingUrl(true);
        try {
            const proxyResponse = await fetch('/api/playlist/fetch-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: playlistUrl.trim() })
            });

            if (proxyResponse.ok) {
                const { content } = await proxyResponse.json();
                await uploadContent(content);
                setShowUrlModal(false);
                setPlaylistUrl('');
            } else {
                alert('Failed to fetch URL');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setFetchingUrl(false);
        }
    };

    // ... (CRUD handlers simplified for brevity, logic remains same)
    const handleAddChannel = async () => {
        if (!newChannel.name || !newChannel.url) {
            alert('Name and URL are required');
            return;
        }
        setAdding(true);
        try {
            const res = await fetch('/api/playlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChannel)
            });
            const data = await res.json();

            if (res.ok) {
                if (data.data) {
                    setSample(prev => [data.data, ...prev]);
                    setStats(prev => prev ? ({ ...prev, totalChannels: prev.totalChannels + 1 }) : null);
                }
                setShowAddModal(false);
                setNewChannel({ name: '', url: '', category: '', logo: '', channelNumber: '', streamFormat: 'hls', drmScheme: '', drmLicenseUrl: '', drmKeyId: '', drmKey: '' });
            } else {
                alert(data.error || 'Failed to add channel');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to add channel');
        } finally {
            setAdding(false);
        }
    };

    const deleteChannel = async (channel) => {
        if (!confirm('Delete this channel?')) return;
        setDeleting(channel.id);
        try {
            await fetch('/api/playlist/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: channel.id })
            });
            setSample(prev => prev.filter(ch => ch.id !== channel.id));
        } finally {
            setDeleting(null);
        }
    };

    const clearPlaylist = async () => {
        if (!confirm('Delete ALL channels?')) return;
        setClearing(true);
        try {
            await fetch('/api/playlist/clear', { method: 'DELETE' });
            setStats(null);
            setSample([]);
        } finally {
            setClearing(false);
        }
    };

    const toggleChannelStatus = async (channel) => {
        setToggling(channel.id);
        try {
            const newStatus = !channel.enabled;
            const res = await fetch('/api/playlist/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: channel.id, enabled: newStatus })
            });

            if (res.ok) {
                // Update local state
                setSample(prev => prev.map(ch =>
                    ch.id === channel.id ? { ...ch, enabled: newStatus } : ch
                ));
            } else {
                alert('Failed to update channel status');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update channel status');
        } finally {
            setToggling(null);
        }
    };

    const startEditing = (channel) => {
        setEditingChannel(channel);
        setEditUrl(channel.url);
        setEditStreamFormat(channel.streamFormat || channel.stream_format || 'hls');
        setEditDrmScheme(channel.drm_scheme || channel.drm?.scheme || '');
        setEditDrmLicenseUrl(channel.drm_license_url || channel.drm?.licenseUrl || '');
        setEditDrmKeyId(channel.drm_key_id || channel.drm?.keyId || '');
        setEditDrmKey(channel.drm_key || channel.drm?.key || '');
        setEditChannelNumber(channel.number || channel.channel_number || '');
    };

    const saveEdit = async () => {
        if (!editingChannel) return;
        setSaving(true);
        try {
            const payload = {
                id: editingChannel.id,
                url: editUrl,
                streamFormat: editStreamFormat,
                channelNumber: editChannelNumber,
                drmScheme: editDrmScheme,
                drmLicenseUrl: editDrmLicenseUrl,
                drmKeyId: editDrmKeyId,
                drmKey: editDrmKey
            };

            const res = await fetch('/api/playlist/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Update local sample with snake_case to match API GET format
                setSample(prev => prev.map(ch =>
                    ch.id === editingChannel.id
                        ? {
                            ...ch,
                            url: editUrl,
                            stream_format: editStreamFormat,
                            channel_number: editChannelNumber,
                            drm_scheme: editDrmScheme,
                            drm_license_url: editDrmLicenseUrl,
                            drm_key_id: editDrmKeyId,
                            drm_key: editDrmKey
                        }
                        : ch
                ));
                setEditingChannel(null);
            } else {
                alert('Update failed');
            }
        } catch (err) {
            console.error(err);
            alert('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const togglePlaylistStatus = async (playlist, isActive) => {
        setSwitchingPlaylist(playlist.id);
        try {
            const res = await fetch('/api/playlists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlist.id, is_active: isActive })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update playlist');

            // Update local state
            setPlaylists(prev => prev.map(p =>
                p.id === playlist.id ? { ...p, is_active: isActive } : p
            ));

            // Refresh main data if we changed something that affects the view
            fetchPlaylistData();

        } catch (err) {
            console.error('Error updating playlist:', err);
            alert(err.message);
        } finally {
            setSwitchingPlaylist(null);
        }
    };

    const deletePlaylist = async (playlist) => {
        if (!confirm(`Delete playlist "${playlist.name}"? This cannot be undone.`)) return;

        setDeletingPlaylist(playlist.id);
        try {
            const res = await fetch('/api/playlists', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlist.id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete playlist');
            }

            setPlaylists(prev => prev.filter(p => p.id !== playlist.id));

            if (activePlaylists.some(p => p.id === playlist.id)) {
                fetchPlaylistData();
            }

        } catch (err) {
            console.error('Error deleting playlist:', err);
            alert(err.message);
        } finally {
            setDeletingPlaylist(null);
        }
    };

    const createPlaylist = async () => {
        if (!newPlaylistName.trim()) {
            alert('Playlist name is required');
            return;
        }

        setCreatingPlaylist(true);
        try {
            // Create the playlist record first
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPlaylistName,
                    description: newPlaylistDesc,
                    sourceUrl: newPlaylistUrl || null
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create playlist');
            }

            // Add new playlist to the list
            setPlaylists(prev => [data.playlist, ...prev]);

            // Now handle the import based on method
            if (uploadMethod === 'file' && uploadedFile) {
                // File upload: Read and import channels
                const reader = new FileReader();
                const fileContent = await new Promise((resolve, reject) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(uploadedFile);
                });

                // Import the file content with playlist_id
                const uploadRes = await fetch('/api/playlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: fileContent,
                        playlist_id: data.playlist.id // Associate with new playlist
                    })
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    alert(`Playlist created with ${uploadData.imported || 0} channels from file!`);
                    // Update playlist count
                    setPlaylists(prev => prev.map(p =>
                        p.id === data.playlist.id ? { ...p, total_channels: uploadData.imported || 0 } : p
                    ));
                } else {
                    alert('Playlist created but failed to import file');
                }

            } else if (newPlaylistUrl.trim() && uploadMethod === 'url') {
                // URL import: Use refresh endpoint
                const refreshRes = await fetch('/api/playlists/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: data.playlist.id })
                });

                const refreshData = await refreshRes.json();

                if (refreshRes.ok) {
                    alert(`Playlist created with ${refreshData.count} channels!`);
                    // Update the playlist in state with new count
                    setPlaylists(prev => prev.map(p =>
                        p.id === data.playlist.id ? { ...p, total_channels: refreshData.count } : p
                    ));
                } else {
                    alert(`Playlist created but failed to import: ${refreshData.error}`);
                }
            } else {
                alert('Playlist created successfully!');
            }

            // Reset form and close modal
            setNewPlaylistName('');
            setNewPlaylistDesc('');
            setNewPlaylistUrl('');
            setUploadedFile(null);
            setUploadMethod('url');
            setShowCreatePlaylist(false);

            // Refresh playlist data if this was activated
            fetchPlaylists();
            fetchPlaylistData();

        } catch (err) {
            console.error('Error creating playlist:', err);
            alert(err.message);
        } finally {
            setCreatingPlaylist(false);
        }
    };

    const refreshPlaylist = async (playlist) => {
        if (!playlist.source_url) {
            alert('This playlist has no source URL to refresh from');
            return;
        }

        setRefreshingPlaylist(playlist.id);
        try {
            const res = await fetch('/api/playlists/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlist.id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to refresh playlist');
            }

            // Update the playlist in state with new count
            setPlaylists(prev => prev.map(p =>
                p.id === playlist.id ? { ...p, total_channels: data.count } : p
            ));

            alert(data.message || `Refreshed ${data.count} channels`);

            // If this is an active playlist, refresh the main view
            if (playlist.is_active) {
                fetchPlaylistData();
            }

        } catch (err) {
            console.error('Error refreshing playlist:', err);
            alert(err.message);
        } finally {
            setRefreshingPlaylist(null);
        }
    };

    const startEditingPlaylist = (playlist) => {
        setEditingPlaylist(playlist);
        setEditPlaylistName(playlist.name);
        setEditPlaylistDesc(playlist.description || '');
        setEditPlaylistUrl(playlist.source_url || '');
    };

    const updatePlaylist = async () => {
        if (!editPlaylistName.trim()) {
            alert('Playlist name is required');
            return;
        }

        setUpdatingPlaylist(true);
        try {
            const res = await fetch('/api/playlists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPlaylist.id,
                    name: editPlaylistName,
                    description: editPlaylistDesc,
                    source_url: editPlaylistUrl
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update playlist');
            }

            // Update the playlist in state
            setPlaylists(prev => prev.map(p =>
                p.id === editingPlaylist.id ? { ...p, name: editPlaylistName, description: editPlaylistDesc, source_url: editPlaylistUrl } : p
            ));

            setEditingPlaylist(null);
            alert('Playlist updated successfully!');

        } catch (err) {
            console.error('Error updating playlist:', err);
            alert(err.message);
        } finally {
            setUpdatingPlaylist(false);
        }
    };

    // UI Render
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Playlist Manager</h1>
                {stats && (
                    <div className="flex gap-2">
                        <button onClick={() => setShowPlaylistsModal(true)} className="btn-secondary">
                            <Layers size={16} className="mr-2" /> Playlists
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="btn-primary">
                            <Plus size={16} className="mr-2" /> Add Channel
                        </button>
                        <button onClick={clearPlaylist} disabled={clearing} className="btn-danger">
                            <Trash2 size={16} className="mr-2" /> Clear All
                        </button>
                    </div>
                )}
            </div>

            {!stats ? (
                <div className="bg-slate-800 rounded-lg p-10 text-center border-2 border-dashed border-slate-700">
                    <Upload size={48} className="mx-auto text-slate-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No Playlist Loaded</h3>
                    <p className="text-slate-400 mb-6">Upload an M3U file or import from URL.</p>

                    <div className="flex justify-center gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                        <button onClick={() => setShowUrlModal(true)} className="btn-secondary">
                            Import URL
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".m3u,.m3u8" />
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
                            <div className="text-sm text-slate-400 font-medium uppercase">Total Channels</div>
                            <div className="text-2xl font-bold text-white mt-1">{stats.totalChannels}</div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
                            <div className="text-sm text-slate-400 font-medium uppercase">Categories</div>
                            <div className="text-2xl font-bold text-white mt-1">{stats.totalGroups}</div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-400 font-medium uppercase">Last Updated</div>
                                <div className="text-sm font-medium text-white mt-1">{new Date(stats.lastUpdated).toLocaleDateString()}</div>
                            </div>
                            <button
                                onClick={fetchPlaylistData}
                                disabled={loading}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                                title="Sync Playlist"
                            >
                                <RefreshCw size={20} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                            <button
                                onClick={() => setSelectedCategory("All")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${selectedCategory === "All" ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                All
                            </button>
                            {stats.groups.map(g => (
                                <button
                                    key={g.name}
                                    onClick={() => setSelectedCategory(g.name)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${selectedCategory === g.name ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="enabled">Enabled Only</option>
                                <option value="disabled">Disabled Only</option>
                            </select>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full bg-slate-900 border-slate-600 rounded-md text-sm py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Group</th>
                                        <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700 bg-slate-800">
                                    {sample
                                        .filter(ch => selectedCategory === "All" || ch.category === selectedCategory)
                                        .filter(ch => ch.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .filter(ch => {
                                            if (statusFilter === 'enabled') return ch.enabled !== false;
                                            if (statusFilter === 'disabled') return ch.enabled === false;
                                            return true; // 'all'
                                        })
                                        .map(ch => (
                                            <tr key={ch.id} className={`hover:bg-slate-700/50 ${ch.enabled === false ? 'opacity-50' : ''}`}>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {ch.logo && <img src={ch.logo} className="h-8 w-8 rounded mr-3 object-cover bg-slate-900" alt="" onError={e => e.target.style.display = 'none'} />}
                                                        <div className={`text-sm font-medium text-white max-w-[150px] md:max-w-none truncate ${ch.enabled === false ? 'line-through' : ''}`}>{ch.name}</div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-700 text-slate-300">
                                                        {ch.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => toggleChannelStatus(ch)}
                                                            disabled={toggling === ch.id}
                                                            className={`${ch.enabled === false ? 'text-slate-500 hover:text-slate-400' : 'text-green-400 hover:text-green-300'}`}
                                                            title={ch.enabled === false ? 'Enable channel' : 'Disable channel'}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                        <button onClick={() => router.push(`/player?id=${ch.id}`)} className="text-blue-400 hover:text-blue-300"><Play size={16} /></button>
                                                        <button onClick={() => startEditing(ch)} className="text-slate-400 hover:text-white"><Edit size={16} /></button>
                                                        <button onClick={() => deleteChannel(ch)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        {sample.length === 0 && <div className="p-8 text-center text-slate-500">No channels found</div>}
                    </div>
                </>
            )}

            {/* Basic Modal Implementation */}
            {showUrlModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">Import from URL</h3>
                        <input
                            type="url"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-4"
                            placeholder="https://example.com/playlist.m3u"
                            value={playlistUrl}
                            onChange={e => setPlaylistUrl(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowUrlModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={importFromUrl} disabled={fetchingUrl} className="btn-primary">
                                {fetchingUrl ? 'Importing...' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Channel Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg shadow-lg max-w-lg w-full p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Add Channel</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                                <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white" value={newChannel.name} onChange={e => setNewChannel({ ...newChannel, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">URL</label>
                                <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white" value={newChannel.url} onChange={e => setNewChannel({ ...newChannel, url: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white" value={newChannel.category} onChange={e => setNewChannel({ ...newChannel, category: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleAddChannel} disabled={adding} className="btn-primary">
                                    {adding ? 'Adding...' : 'Add Channel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Playlists Modal */}
            {showPlaylistsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full p-6 border border-slate-700 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Manage Playlists</h3>
                            <button onClick={() => setShowPlaylistsModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-2 mb-6">
                            {playlists.map(pl => (
                                <div key={pl.id} className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-700">
                                    <div>
                                        <div className="font-medium text-white">{pl.name}</div>
                                        <div className="text-xs text-slate-400">{pl.total_channels} channels</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEditingPlaylist(pl)}
                                            className="text-xs bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-500"
                                            title="Edit playlist"
                                        >
                                            <Edit size={14} className="inline" />
                                        </button>
                                        {pl.source_url && (
                                            <button
                                                onClick={() => refreshPlaylist(pl)}
                                                disabled={refreshingPlaylist === pl.id}
                                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                                title="Refresh from source URL"
                                            >
                                                {refreshingPlaylist === pl.id ? 'Refreshing...' : 'Refresh'}
                                            </button>
                                        )}
                                        {pl.is_active ? (
                                            <button
                                                onClick={() => togglePlaylistStatus(pl, false)}
                                                disabled={switchingPlaylist === pl.id}
                                                className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                                            >
                                                {switchingPlaylist === pl.id ? 'Updating...' : 'Deactivate'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => togglePlaylistStatus(pl, true)}
                                                disabled={switchingPlaylist === pl.id}
                                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                                            >
                                                {switchingPlaylist === pl.id ? 'Updating...' : 'Activate'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deletePlaylist(pl)}
                                            disabled={deletingPlaylist === pl.id}
                                            className="text-slate-400 hover:text-red-400 disabled:opacity-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowCreatePlaylist(true)} className="btn-primary w-full">Create New Playlist</button>
                    </div>
                </div>
            )}

            {/* Edit Playlist Modal */}
            {editingPlaylist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg shadow-lg max-w-lg w-full p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Edit Playlist</h3>
                            <button onClick={() => setEditingPlaylist(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Playlist Name *</label>
                                <input
                                    className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white"
                                    value={editPlaylistName}
                                    onChange={e => setEditPlaylistName(e.target.value)}
                                    placeholder="My Playlist"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white"
                                    value={editPlaylistDesc}
                                    onChange={e => setEditPlaylistDesc(e.target.value)}
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Source URL</label>
                                <input
                                    className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white"
                                    value={editPlaylistUrl}
                                    onChange={e => setEditPlaylistUrl(e.target.value)}
                                    placeholder="https://example.com/playlist.m3u"
                                />
                                <p className="text-xs text-slate-500 mt-1">Change the URL and click Refresh in the playlist list to reload channels</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setEditingPlaylist(null)} className="btn-secondary">Cancel</button>
                                <button onClick={updatePlaylist} disabled={updatingPlaylist} className="btn-primary">
                                    {updatingPlaylist ? 'Updating...' : 'Update Playlist'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Playlist Modal */}
            {showCreatePlaylist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg shadow-lg max-w-lg w-full p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Create New Playlist</h3>
                            <button onClick={() => { setShowCreatePlaylist(false); setUploadedFile(null); setUploadMethod('url'); }} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Playlist Name *</label>
                                <input
                                    className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white"
                                    value={newPlaylistName}
                                    onChange={e => setNewPlaylistName(e.target.value)}
                                    placeholder="My Playlist"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white"
                                    value={newPlaylistDesc}
                                    onChange={e => setNewPlaylistDesc(e.target.value)}
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>

                            {/* Upload Method Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Import Method</label>
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setUploadMethod('url')}
                                        className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${uploadMethod === 'url'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        <Link size={16} className="inline mr-2" />
                                        From URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadMethod('file')}
                                        className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${uploadMethod === 'file'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        <Upload size={16} className="inline mr-2" />
                                        From File
                                    </button>
                                </div>

                                {uploadMethod === 'url' ? (
                                    <div>
                                        <input
                                            className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white"
                                            value={newPlaylistUrl}
                                            onChange={e => setNewPlaylistUrl(e.target.value)}
                                            placeholder="https://example.com/playlist.m3u"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Enter a URL to import M3U playlist</p>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            ref={playlistFileRef}
                                            onChange={e => setUploadedFile(e.target.files[0])}
                                            accept=".m3u,.m3u8"
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => playlistFileRef.current?.click()}
                                            className="w-full bg-slate-900 border-2 border-dashed border-slate-600 rounded p-4 text-center hover:border-blue-500 transition-colors"
                                        >
                                            {uploadedFile ? (
                                                <div className="flex items-center justify-center gap-2 text-green-400">
                                                    <CheckCircle size={20} />
                                                    <span className="font-medium">{uploadedFile.name}</span>
                                                </div>
                                            ) : (
                                                <div className="text-slate-400">
                                                    <Upload size={32} className="mx-auto mb-2" />
                                                    <p className="font-medium">Click to upload M3U file</p>
                                                    <p className="text-xs mt-1">Supports .m3u and .m3u8 files</p>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => { setShowCreatePlaylist(false); setUploadedFile(null); setUploadMethod('url'); }} className="btn-secondary">Cancel</button>
                                <button onClick={createPlaylist} disabled={creatingPlaylist} className="btn-primary">
                                    {creatingPlaylist ? 'Creating...' : 'Create Playlist'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Channel Modal */}
            {editingChannel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg shadow-lg max-w-lg w-full p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Edit Channel</h3>
                            <button onClick={() => setEditingChannel(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                                <div className="p-2 text-sm font-medium border border-slate-600 rounded bg-slate-900 text-slate-300">{editingChannel.name}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Stream URL</label>
                                <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white" value={editUrl} onChange={e => setEditUrl(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Format</label>
                                    <select className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white" value={editStreamFormat} onChange={e => setEditStreamFormat(e.target.value)}>
                                        <option value="hls">HLS</option>
                                        <option value="ts">MPEG-TS</option>
                                        <option value="mpd">MPEG-DASH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Number</label>
                                    <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white" type="number" placeholder="#" value={editChannelNumber} onChange={e => setEditChannelNumber(e.target.value)} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    <Lock size={12} /> DRM Configuration
                                </div>
                                <select className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white mb-3" value={editDrmScheme} onChange={e => setEditDrmScheme(e.target.value)}>
                                    <option value="">None</option>
                                    <option value="clearkey">ClearKey</option>
                                    <option value="widevine">Widevine</option>
                                </select>

                                {editDrmScheme === 'clearkey' && (
                                    <div className="space-y-3">
                                        <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white font-mono text-xs" type="text" placeholder="Key ID" value={editDrmKeyId} onChange={e => setEditDrmKeyId(e.target.value)} />
                                        <input className="form-input w-full bg-slate-900 border-slate-600 rounded p-2 text-white font-mono text-xs" type="text" placeholder="Key" value={editDrmKey} onChange={e => setEditDrmKey(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setEditingChannel(null)} className="btn-secondary">Cancel</button>
                                <button onClick={saveEdit} disabled={saving} className="btn-primary">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
