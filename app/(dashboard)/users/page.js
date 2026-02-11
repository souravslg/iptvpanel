'use client';

import { useEffect, useState } from 'react';
import {
    Users, Plus, Search, Edit, Trash2, RefreshCw,
    Check, Copy, Link2, UserMinus, UserCheck,
    Calendar, Key, Shield, Hash, Activity
} from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [copied, setCopied] = useState(false);

    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        maxConnections: 1,
        expireDate: '',
        packageName: 'Full Package',
        status: 'Active',
        notes: ''
    });

    const [editUser, setEditUser] = useState({
        username: '',
        password: '',
        maxConnections: 1,
        expireDate: '',
        packageName: 'Full Package',
        status: 'Active',
        notes: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                setShowAddModal(false);
                setNewUser({
                    username: '',
                    password: '',
                    maxConnections: 1,
                    expireDate: '',
                    packageName: 'Full Package',
                    status: 'Active',
                    notes: ''
                });
                fetchUsers();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this subscriber?')) return;
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, status: newStatus })
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const startEditing = (user) => {
        setEditingUser(user);
        setEditUser({
            username: user.username,
            password: user.password,
            maxConnections: user.max_connections || 1,
            expireDate: user.expire_date ? user.expire_date.split('T')[0] : '',
            packageName: user.package || 'Full Package',
            status: user.status || 'Active',
            notes: user.notes || ''
        });
        setShowEditModal(true);
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingUser.id,
                    username: editUser.username,
                    password: editUser.password,
                    maxConnections: editUser.maxConnections,
                    expireDate: editUser.expireDate,
                    packageName: editUser.packageName,
                    status: editUser.status,
                    notes: editUser.notes
                })
            });

            if (res.ok) {
                setShowEditModal(false);
                setEditingUser(null);
                fetchUsers();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        const performCopy = async () => {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    setCopied(true);
                }
            } catch (err) {
                console.error('Copy failed', err);
            } finally {
                setTimeout(() => setCopied(false), 2000);
            }
        };
        performCopy();
    };

    const getLinks = (user) => {
        if (!user) return { m3u: '', xtream: '' };
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
        const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
        const base = `${protocol}//${host}`;
        return {
            m3u: `${base}/api/get?username=${encodeURIComponent(user.username)}&password=${encodeURIComponent(user.password)}`,
            xtream: base
        };
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        (user.notes && user.notes.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="animate-slide-up space-y-10">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold font-outfit text-white tracking-tight leading-none mb-2 md:mb-3">
                        User Management List
                    </h1>
                    <p className="text-muted-foreground font-medium text-base md:text-lg">
                        Manage active identities and access protocols.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary w-full md:w-auto"
                >
                    <Plus size={20} />
                    Onboard Subscriber
                </button>
            </div>

            {/* Strategic Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Scan subscriber database..."
                        className="pl-14 py-4"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-secondary/30 px-6 py-4 rounded-2xl border border-white/5">
                    <Activity size={18} className="text-primary" />
                    <span className="text-sm font-bold text-white uppercase tracking-widest">{filteredUsers.length} Nodes Online</span>
                </div>
            </div>

            {/* Main Table */}
            <div className="table-container shadow-2xl rounded-2xl overflow-hidden border border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr>
                                <th>Identity Profile</th>
                                <th>Operational State</th>
                                <th>Service Tier</th>
                                <th>Termination Date</th>
                                <th className="text-right">Command Center</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-32 text-muted-foreground">
                                    <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
                                    <span className="font-bold tracking-widest uppercase text-xs">Syncing Database...</span>
                                </td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="group">
                                    <td>
                                        <div className="flex items-center gap-5">
                                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-grad-primary p-[2px] shadow-lg shadow-primary/20">
                                                <div className="w-full h-full rounded-[14px] bg-secondary flex items-center justify-center font-black text-primary font-outfit text-xl leading-none">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-extrabold text-white text-lg tracking-tight group-hover:text-primary transition-colors cursor-default">
                                                    {user.username}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Key size={12} className="text-muted-foreground" />
                                                    <span className="text-xs font-mono text-muted-foreground bg-white/5 py-0.5 px-2 rounded-md">{user.password}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-suspended'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                                            <Shield size={14} className="text-indigo-400" />
                                            {user.package || 'Full Access'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="inline-flex items-center gap-2 text-slate-400 font-medium bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                                            <Calendar size={13} className="opacity-50" />
                                            {user.expire_date ? new Date(user.expire_date).toLocaleDateString() : 'Infinite'}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowLinkModal(true); }}
                                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/20 border border-indigo-500/20 active:scale-90"
                                                title="Protocols"
                                            >
                                                <Link2 size={20} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditing(user); }}
                                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20 border border-emerald-500/20 active:scale-90"
                                                title="Configure"
                                            >
                                                <Edit size={20} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleStatus(user); }}
                                                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all shadow-lg border active:scale-90 ${user.status === 'Active'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-white'
                                                    }`}
                                            >
                                                {user.status === 'Active' ? <UserMinus size={20} /> : <UserCheck size={20} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:shadow-rose-500/20 border border-rose-500/20 active:scale-90"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Modals with Correct Layering --- */}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
                    <div className="glass-modal w-full max-w-2xl p-10 rounded-[2.5rem] animate-slide-up">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black font-outfit text-white tracking-tighter">Initialize Node</h2>
                                <p className="text-primary font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Strategic Onboarding Protocol</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all text-xl">✕</button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Identity Token</label>
                                    <div className="relative group">
                                        <input type="text" className="bg-black/40" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required placeholder="Sub_ID_88" />
                                        <button type="button" onClick={() => setNewUser({ ...newUser, username: Math.random().toString(36).slice(2, 10) })} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 transition-transform"><RefreshCw size={18} /></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Secure Key</label>
                                    <input type="text" className="bg-black/40" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Terminal Access</label>
                                    <select className="bg-black/40" value={newUser.packageName} onChange={e => setNewUser({ ...newUser, packageName: e.target.value })}>
                                        <option>Full Package</option>
                                        <option>Premium Plus</option>
                                        <option>Standard Core</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Operational Lifespan</label>
                                    <input type="date" className="bg-black/40" value={newUser.expireDate} onChange={e => setNewUser({ ...newUser, expireDate: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Administrative Logs</label>
                                    <textarea className="bg-black/40 h-24" value={newUser.notes} onChange={e => setNewUser({ ...newUser, notes: e.target.value })} placeholder="Internal documentation..."></textarea>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-bold text-white bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10">Abort</button>
                                <button type="submit" className="btn-primary flex-1 py-4 text-sm font-black tracking-widest uppercase">Authorize Node</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
                    <div className="glass-modal w-full max-w-2xl p-10 rounded-[2.5rem] animate-slide-up">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black font-outfit text-white tracking-tighter">Modify Parameter</h2>
                                <p className="text-primary font-bold uppercase text-[10px] tracking-[0.3em] mt-1 text-emerald-400">Updating Operational Logic: {editingUser.username}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all text-xl">✕</button>
                        </div>

                        <form onSubmit={handleEditUser} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Subscriber ID</label>
                                    <input type="text" className="bg-black/10 border-white/5 focus:border-emerald-500/50" value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Access Key</label>
                                    <input type="text" className="bg-black/10 border-white/5 focus:border-emerald-500/50" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Service Plan</label>
                                    <select className="bg-black/10" value={editUser.packageName} onChange={e => setEditUser({ ...editUser, packageName: e.target.value })}>
                                        <option>Full Package</option>
                                        <option>Premium Plus</option>
                                        <option>Standard Core</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Termination Date</label>
                                    <input type="date" className="bg-black/10" value={editUser.expireDate} onChange={e => setEditUser({ ...editUser, expireDate: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Operational State</label>
                                    <select className="bg-black/10" value={editUser.status} onChange={e => setEditUser({ ...editUser, status: e.target.value })}>
                                        <option>Active</option>
                                        <option>Suspended</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-2">Subscription Log</label>
                                    <textarea className="bg-black/10 h-24" value={editUser.notes} onChange={e => setEditUser({ ...editUser, notes: e.target.value })}></textarea>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 font-bold text-white bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10">Cancel</button>
                                <button type="submit" className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest text-sm uppercase shadow-lg shadow-emerald-500/20 transition-all">Save Adjustments</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Links Modal */}
            {showLinkModal && selectedUser && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-6 overflow-y-auto">
                    <div className="glass-modal w-full max-w-2xl p-12 rounded-[3rem] animate-slide-up border-primary/40 shadow shadow-primary/10">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h2 className="text-4xl font-black font-outfit text-white tracking-tighter">Protocol Access</h2>
                                <p className="text-primary font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Subscriber Node: {selectedUser.username}</p>
                            </div>
                            <button onClick={() => setShowLinkModal(false)} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-xl">✕</button>
                        </div>

                        <div className="space-y-12">
                            {/* Universal M3U */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-glow shadow-primary" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Universal M3U8 Stream Gateway</span>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-grad-primary opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                                    <div className="relative flex items-center gap-2 bg-black/80 rounded-2xl border border-white/10 p-2 overflow-hidden">
                                        <div className="flex-1 font-mono text-xs p-4 overflow-hidden truncate text-slate-300">
                                            {getLinks(selectedUser).m3u}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(getLinks(selectedUser).m3u)}
                                            className="w-14 h-14 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center flex-shrink-0"
                                        >
                                            {copied ? <Check size={22} /> : <Copy size={22} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Xtream API Virtualization */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-glow shadow-indigo-500" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Xtream API Virtualization Deck</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/50 transition-all">
                                        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-4 opacity-70">Server Interface</p>
                                        <div className="flex items-center justify-between gap-4">
                                            <code className="text-sm font-mono text-slate-200 truncate">{getLinks(selectedUser).xtream}</code>
                                            <button onClick={() => copyToClipboard(getLinks(selectedUser).xtream)} className="text-muted-foreground hover:text-white"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/50 transition-all">
                                        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-4 opacity-70">Sync Credentials</p>
                                        <div className="flex items-center justify-between gap-4">
                                            <code className="text-sm font-mono text-slate-200">{selectedUser.username}</code>
                                            <button onClick={() => copyToClipboard(selectedUser.username)} className="text-muted-foreground hover:text-white"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/50 transition-all md:col-span-2">
                                        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-4 opacity-70">Encryption Vector</p>
                                        <div className="flex items-center justify-between gap-4">
                                            <code className="text-sm font-mono text-slate-200 tracking-widest">{selectedUser.password}</code>
                                            <button onClick={() => copyToClipboard(selectedUser.password)} className="text-muted-foreground hover:text-white"><Copy size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="px-12 py-5 rounded-2xl bg-grad-primary text-white font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Secure Portal Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-48 border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 opacity-20">
                        <Users size={32} />
                    </div>
                    <h3 className="text-2xl font-bold font-outfit text-white mb-2 tracking-tight">Zero Interferences Detected</h3>
                    <p className="text-muted-foreground text-lg">No nodes match the current scanning criteria: &quot;{search}&quot;</p>
                </div>
            )}
        </div>
    );
}
