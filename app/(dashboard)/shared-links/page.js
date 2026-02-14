'use client';

import { useState, useEffect } from 'react';
import { Copy, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SharedLinksPage() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sourceUrl: 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u',
        expireDate: '',
        maxUses: ''
    });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const response = await fetch('/api/shared-links');
            const data = await response.json();
            setLinks(data);
        } catch (error) {
            console.error('Failed to fetch links:', error);
            alert('Failed to fetch links');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name,
                sourceUrl: formData.sourceUrl,
                expireDate: formData.expireDate || null,
                maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
            };

            if (editingLink) {
                payload.id = editingLink.id;
                await fetch('/api/shared-links', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await fetch('/api/shared-links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            setShowModal(false);
            setEditingLink(null);
            setFormData({
                name: '',
                sourceUrl: 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u',
                expireDate: '',
                maxUses: ''
            });
            fetchLinks();
        } catch (error) {
            console.error('Failed to save link:', error);
            alert('Failed to save link');
        }
    };

    const handleEdit = (link) => {
        setEditingLink(link);
        setFormData({
            name: link.name,
            sourceUrl: link.source_url,
            expireDate: link.expire_date ? new Date(link.expire_date).toISOString().split('T')[0] : '',
            maxUses: link.max_uses || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            await fetch(`/api/shared-links?id=${id}`, { method: 'DELETE' });
            fetchLinks();
        } catch (error) {
            console.error('Failed to delete link:', error);
            alert('Failed to delete link');
        }
    };

    const handleToggleStatus = async (link) => {
        try {
            await fetch('/api/shared-links', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: link.id,
                    status: link.status === 'Active' ? 'Inactive' : 'Active'
                })
            });
            fetchLinks();
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert('Failed to toggle status');
        }
    };

    const copyToClipboard = (linkId) => {
        const url = `${window.location.origin}/share/${linkId}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (link) => {
        if (link.status === 'Expired') {
            return <span className="status-badge expired">Expired</span>;
        }

        if (link.expire_date && new Date(link.expire_date) < new Date()) {
            return <span className="status-badge expired">Expired</span>;
        }

        if (link.max_uses && link.current_uses >= link.max_uses) {
            return <span className="status-badge used-up">Used Up</span>;
        }

        return link.status === 'Active' ?
            <span className="status-badge active">Active</span> :
            <span className="status-badge inactive">Inactive</span>;
    };

    return (
        <div className="container">
            <div className="header">
                <h1>Shared M3U Links</h1>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setEditingLink(null);
                        setFormData({
                            name: '',
                            sourceUrl: 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u',
                            expireDate: '',
                            maxUses: ''
                        });
                        setShowModal(true);
                    }}
                >
                    <Plus size={18} /> Create New Link
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="table-container">
                    <table className="links-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Link</th>
                                <th>Expiry Date</th>
                                <th>Uses</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {links.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No shared links yet. Create one to get started!
                                    </td>
                                </tr>
                            ) : (
                                links.map((link) => (
                                    <tr key={link.id}>
                                        <td>{link.name}</td>
                                        <td>
                                            <div className="link-cell">
                                                <code>/share/{link.link_id.substring(0, 8)}...</code>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => copyToClipboard(link.link_id)}
                                                    title="Copy full URL"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td>{formatDate(link.expire_date)}</td>
                                        <td>
                                            {link.current_uses} / {link.max_uses || '∞'}
                                        </td>
                                        <td>{getStatusBadge(link)}</td>
                                        <td>{formatDate(link.created_at)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(link)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleToggleStatus(link)}
                                                    title={link.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {link.status === 'Active' ?
                                                        <ToggleRight size={16} /> :
                                                        <ToggleLeft size={16} />
                                                    }
                                                </button>
                                                <button
                                                    className="btn-icon btn-danger"
                                                    onClick={() => handleDelete(link.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingLink ? 'Edit Shared Link' : 'Create Shared Link'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Customer ABC - Monthly Access"
                                />
                            </div>

                            <div className="form-group">
                                <label>Source M3U URL *</label>
                                <input
                                    type="url"
                                    value={formData.sourceUrl}
                                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expireDate}
                                    onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Max Uses (Optional)</label>
                                <input
                                    type="number"
                                    value={formData.maxUses}
                                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                    min="1"
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingLink ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    background: #f8fafc;
                    min-height: 100vh;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                h1 {
                    font-size: 2rem;
                    font-weight: 600;
                    margin: 0;
                    color: #1e293b;
                }

                .btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #3b82f6;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background 0.2s;
                }

                .btn-primary:hover {
                    background: #2563eb;
                }

                .table-container {
                    background: white;
                    border-radius: 0.75rem;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .links-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .links-table th {
                    background: #f8fafc;
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 1px solid #e2e8f0;
                }

                .links-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #f1f5f9;
                    color: #1e293b;
                    background: white;
                }

                .links-table tr {
                    background: white;
                }

                .links-table tbody tr:hover {
                    background: #f8fafc;
                }

                .link-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                code {
                    background: #f1f5f9;
                    color: #1e293b;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    font-family: monospace;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .status-badge.active {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-badge.inactive {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .status-badge.expired {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .status-badge.used-up {
                    background: #fef3c7;
                    color: #92400e;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                    color: #64748b;
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    background: #f1f5f9;
                    color: #3b82f6;
                }

                .btn-icon.btn-danger:hover {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: white;
                    padding: 2rem;
                    border-radius: 0.75rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal h2 {
                    margin: 0 0 1.5rem 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #1e293b;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    background: white;
                    color: #1e293b;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 2rem;
                }

                .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #1e293b;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: #f8fafc;
                }
            `}</style>
        </div>
    );
}
