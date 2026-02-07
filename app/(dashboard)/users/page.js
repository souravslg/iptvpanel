'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Search, UserMinus, UserCheck, RefreshCw } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // New User Form State
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        maxConnections: 1,
        expireDate: '',
        packageName: 'Full Package',
        notes: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCreds = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const gen = (len) => Array(len).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        setNewUser(prev => ({ ...prev, username: gen(8), password: gen(10) }));
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
                fetchUsers();
                // Reset form
                setNewUser({ username: '', password: '', maxConnections: 1, expireDate: '', packageName: 'Full Package', notes: '' });
            }
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            fetchUsers();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
        try {
            await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, status: newStatus })
            });
            fetchUsers();
        } catch (error) {
            console.error('Status update failed', error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        (user.notes && user.notes.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <div className="header-row">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage subscriptions and account status.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Add User
                </button>
            </div>

            {/* Filters */}
            <div className="flex-row" style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Status</th>
                            <th>Plan</th>
                            <th>Expires</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center p-8">Loading users...</td></tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="flex-row">
                                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{user.username}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Pwd: {user.password}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-suspended'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>{user.package}</td>
                                <td style={{ color: 'var(--muted-foreground)' }}>
                                    {user.expire_date ? new Date(user.expire_date).toLocaleDateString() : 'Never'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => toggleStatus(user)}
                                            style={{ background: 'none', border: 'none', color: user.status === 'Active' ? '#f87171' : '#4ade80', cursor: 'pointer', padding: '0.25rem' }}
                                            title={user.status === 'Active' ? 'Disable' : 'Enable'}
                                        >
                                            {user.status === 'Active' ? <UserMinus size={16} /> : <UserCheck size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div className="stat-card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
                        <h2 className="text-xl font-bold mb-4">Create New User</h2>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label>Username</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                                        <button type="button" onClick={() => setNewUser({ ...newUser, username: Math.random().toString(36).slice(2, 10) })} className="p-2 border rounded hover:bg-white/10"><RefreshCw size={16} /></button>
                                    </div>
                                </div>
                                <div>
                                    <label>Password</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                        <button type="button" onClick={() => setNewUser({ ...newUser, password: Math.random().toString(36).slice(2, 12) })} className="p-2 border rounded hover:bg-white/10"><RefreshCw size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label>Max Connections</label>
                                    <input type="number" min="1" value={newUser.maxConnections} onChange={e => setNewUser({ ...newUser, maxConnections: e.target.value })} />
                                </div>
                                <div>
                                    <label>Expiration Date</label>
                                    <input type="date" value={newUser.expireDate} onChange={e => setNewUser({ ...newUser, expireDate: e.target.value })} required />
                                </div>
                            </div>

                            <div>
                                <label>Package</label>
                                <select value={newUser.packageName} onChange={e => setNewUser({ ...newUser, packageName: e.target.value })}>
                                    <option>Full Package</option>
                                    <option>Sports Only</option>
                                    <option>Movies Only</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)' }}>
                    No users found matching "{search}"
                </div>
            )}
        </div>
    );
}
