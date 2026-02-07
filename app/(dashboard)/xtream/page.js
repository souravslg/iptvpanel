'use client';

import { useState } from 'react';
import { Copy, RefreshCw, Key, UserCheck, Calendar, Shield, Save } from 'lucide-react';

export default function XtreamPage() {
    const generateString = (length) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const [formData, setFormData] = useState({
        username: generateString(8),
        password: generateString(10),
        maxConnections: 1,
        expireDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        package: 'Full Package',
        notes: ''
    });

    const [createdAccount, setCreatedAccount] = useState(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        try {
            console.log('Creating Xtream user:', formData);

            const res = await fetch('/api/xtream/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            console.log('User created successfully:', data);

            // Get the current server URL
            const serverUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}`
                : 'http://localhost:3000';

            const newAccount = {
                ...formData,
                id: data.user.id,
                serverUrl: serverUrl,
                createdAt: new Date().toLocaleString()
            };

            setCreatedAccount(newAccount);
            alert('Line created successfully!');
        } catch (err) {
            console.error('Error creating user:', err);
            setError(err.message);
            alert('Failed to create line: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleGenerate = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'username' ? generateString(8) : generateString(10)
        }));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add toast notification here
    };

    return (
        <div className="space-y-8">
            <div className="header-row">
                <div>
                    <h1 className="page-title">Xtream Code Generator</h1>
                    <p className="page-subtitle">Create and manage Xtream API credentials.</p>
                </div>
            </div>

            <div className="split-grid">
                {/* Creation Form */}
                <div className="stat-card">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Key className="text-primary" size={20} />
                        Create New Line
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label>Username</label>
                            <div className="flex-row">
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => handleGenerate('username')}
                                    className="p-2 border border-[var(--border)] rounded-[var(--radius)] hover:bg-[var(--secondary)] transition-colors"
                                    title="Generate Random"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label>Password</label>
                            <div className="flex-row">
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => handleGenerate('password')}
                                    className="p-2 border border-[var(--border)] rounded-[var(--radius)] hover:bg-[var(--secondary)] transition-colors"
                                    title="Generate Random"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label>Max Connections</label>
                                <select
                                    value={formData.maxConnections}
                                    onChange={(e) => setFormData({ ...formData, maxConnections: e.target.value })}
                                >
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Expiration</label>
                                <input
                                    type="date"
                                    value={formData.expireDate}
                                    onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label>Package</label>
                            <select
                                value={formData.package}
                                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                            >
                                <option>Full Package (All Channels)</option>
                                <option>Sports Only</option>
                                <option>Movies & Series</option>
                                <option>Kids Package</option>
                            </select>
                        </div>

                        <div>
                            <label>Notes (Optional)</label>
                            <textarea
                                rows="2"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>


                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            style={{ opacity: creating ? 0.7 : 1, cursor: creating ? 'not-allowed' : 'pointer' }}
                        >
                            {creating ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            {creating ? 'Creating...' : 'Create Line'}
                        </button>
                    </form>
                </div>

                {/* Result Card */}
                <div className="space-y-6">
                    {createdAccount ? (
                        <div className="stat-card border-l-4 border-l-[var(--primary)] animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-[var(--foreground)]">Line Created Successfully!</h3>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">Active</span>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] group relative">
                                    <div className="text-[var(--muted-foreground)] text-xs mb-1">Host URL</div>
                                    <div className="font-mono text-[var(--primary)] break-all">{createdAccount.serverUrl}</div>
                                    <button
                                        onClick={() => copyToClipboard(createdAccount.serverUrl)}
                                        className="absolute right-2 top-2 p-1.5 hover:bg-[var(--card)] rounded transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] group relative">
                                        <div className="text-[var(--muted-foreground)] text-xs mb-1">Username</div>
                                        <div className="font-mono font-bold">{createdAccount.username}</div>
                                        <button
                                            onClick={() => copyToClipboard(createdAccount.username)}
                                            className="absolute right-2 top-2 p-1.5 hover:bg-[var(--card)] rounded transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                    <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)] group relative">
                                        <div className="text-[var(--muted-foreground)] text-xs mb-1">Password</div>
                                        <div className="font-mono font-bold">{createdAccount.password}</div>
                                        <button
                                            onClick={() => copyToClipboard(createdAccount.password)}
                                            className="absolute right-2 top-2 p-1.5 hover:bg-[var(--card)] rounded transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 bg-[var(--secondary)]/50 rounded-lg border border-[var(--border)]">
                                    <div className="text-[var(--muted-foreground)] text-xs mb-2">M3U URL</div>
                                    <div className="font-mono text-xs break-all text-[var(--muted-foreground)]">
                                        {`${createdAccount.serverUrl}/get.php?username=${createdAccount.username}&password=${createdAccount.password}&type=m3u_plus&output=ts`}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(`${createdAccount.serverUrl}/get.php?username=${createdAccount.username}&password=${createdAccount.password}&type=m3u_plus&output=ts`)}
                                        className="mt-2 w-full py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--card)] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Copy size={14} /> Copy M3U
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="stat-card flex flex-col items-center justify-center text-center py-12 text-[var(--muted-foreground)] h-full min-h-[400px]">
                            <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center mb-4">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--foreground)]">No Line Selected</h3>
                            <p className="max-w-xs mt-2">Fill out the form on the left to generate new Xtream credentials.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
