'use client';

import { useState, useEffect } from 'react';
import { Save, Server, Globe, Shield, Video } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        invalid_subscription_video: '',
        server_name: 'IPTV Panel',
        server_url: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem' }}>Loading settings...</div>;
    }

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your panel preferences and server defaults.</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* General Settings */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe style={{ color: 'var(--primary)' }} size={20} />
                        General
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label>Panel Name</label>
                            <input
                                type="text"
                                value={settings.server_name || ''}
                                onChange={(e) => setSettings({ ...settings, server_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Server URL</label>
                            <input
                                type="text"
                                value={settings.server_url || ''}
                                onChange={(e) => setSettings({ ...settings, server_url: e.target.value })}
                                placeholder="https://your-domain.com"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                Your panel's public URL
                            </p>
                        </div>
                    </div>
                </div>

                {/* Invalid Subscription Video */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Video style={{ color: '#ef4444' }} size={20} />
                        Invalid Subscription Video
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label>Video URL</label>
                            <input
                                type="text"
                                value={settings.invalid_subscription_video || ''}
                                onChange={(e) => setSettings({ ...settings, invalid_subscription_video: e.target.value })}
                                placeholder="https://example.com/invalid-subscription.mp4"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                This video will be shown to users with expired or inactive subscriptions
                            </p>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '0.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#60a5fa' }}>
                                <strong>Tip:</strong> Upload your custom "Invalid Subscription" video to a CDN or hosting service,
                                then paste the direct video URL here. Supported formats: MP4, M3U8, TS
                            </p>
                        </div>
                    </div>
                </div>

                {/* Streaming Settings */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Server style={{ color: '#22c55e' }} size={20} />
                        Streaming Configuration
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label>Default Stream Format</label>
                            <select>
                                <option>HLS (m3u8)</option>
                                <option>MPEG-TS (ts)</option>
                                <option>RTMP</option>
                            </select>
                        </div>
                        <div>
                            <label>Max Connections Per User</label>
                            <input type="number" defaultValue="1" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Allowed User Agents</label>
                            <textarea rows="3" defaultValue="VLC, Kodi, IPTVSmarters, *" />
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                Separate with commas. Use * for all.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield style={{ color: '#f87171' }} size={20} />
                        Security & Access
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <div style={{ fontWeight: '500' }}>Force HTTPS</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Redirect all HTTP traffic to HTTPS</div>
                        </div>
                        <div style={{ width: '3rem', height: '1.5rem', backgroundColor: 'var(--primary)', borderRadius: '9999px', position: 'relative', cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', right: '0.25rem', top: '0.25rem', width: '1rem', height: '1rem', backgroundColor: 'white', borderRadius: '9999px' }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={() => fetchSettings()}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--secondary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
