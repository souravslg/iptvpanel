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
        <div className=\"space-y-8 max-w-4xl\">
            < div >
            <h1 className=\"text-3xl font-bold\">Settings</h1>
                < p className =\"text-muted-foreground mt-1\">Configure your panel preferences and server defaults.</p>
            </div >

        <div className=\"grid gap-8\">
    {/* General Settings */ }
    <div className=\"glass-panel p-6 rounded-xl border border-white/10\">
        < h2 className =\"text-xl font-semibold mb-4 flex items-center gap-2\">
            < Globe className =\"text-primary\" size={20} />
    General
                    </h2 >
        <div className=\"space-y-4\">
            < div >
            <label className=\"block text-sm font-medium mb-1\">Panel Name</label>
                < input
    type =\"text\" 
    value = { settings.server_name || '' }
    onChange = {(e) => setSettings({ ...settings, server_name: e.target.value })
}
                            />
                        </div >
                        <div>
                            <label className=\"block text-sm font-medium mb-1\">Server URL</label>
                            <input 
                                type=\"text\" 
value = { settings.server_url || '' }
onChange = {(e) => setSettings({ ...settings, server_url: e.target.value })}
placeholder =\"https://your-domain.com\"
    />
    <p className=\"text-xs text-muted-foreground mt-1\">Your panel's public URL</p>
                        </div >
                    </div >
                </div >

    {/* Invalid Subscription Video */ }
    < div className =\"glass-panel p-6 rounded-xl border border-white/10\">
        < h2 className =\"text-xl font-semibold mb-4 flex items-center gap-2\">
            < Video className =\"text-red-500\" size={20} />
                        Invalid Subscription Video
                    </h2 >
    <div className=\"space-y-4\">
        < div >
        <label className=\"block text-sm font-medium mb-1\">Video URL</label>
            < input
type =\"text\" 
value = { settings.invalid_subscription_video || '' }
onChange = {(e) => setSettings({ ...settings, invalid_subscription_video: e.target.value })}
placeholder =\"https://example.com/invalid-subscription.mp4\"
    />
    <p className=\"text-xs text-muted-foreground mt-1\">
                                This video will be shown to users with expired or inactive subscriptions
                            </p >
                        </div >
    <div className=\"p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg\">
        < p className =\"text-sm text-blue-400\">
            < strong > Tip:</strong > Upload your custom \"Invalid Subscription\" video to a CDN or hosting service, 
                                then paste the direct video URL here.Supported formats: MP4, M3U8, TS
                            </p >
                        </div >
                    </div >
                </div >

    {/* Streaming Settings */ }
    < div className =\"glass-panel p-6 rounded-xl border border-white/10\">
        < h2 className =\"text-xl font-semibold mb-4 flex items-center gap-2\">
            < Server className =\"text-green-500\" size={20} />
                        Streaming Configuration
                    </h2 >
    <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
        < div >
        <label className=\"block text-sm font-medium mb-1\">Default Stream Format</label>
            < select >
                                <option>HLS (m3u8)</option>
                                <option>MPEG-TS (ts)</option>
                                <option>RTMP</option>
                            </select >
                        </div >
                        <div>
                            <label className=\"block text-sm font-medium mb-1\">Max Connections Per User</label>
                            <input type=\"number\" defaultValue=\"1\" />
                        </div >
    <div className=\"md:col-span-2\">
        < label className =\"block text-sm font-medium mb-1\">Allowed User Agents</label>
            < textarea rows =\"3\" defaultValue=\"VLC, Kodi, IPTVSmarters, *\" />
                < p className =\"text-xs text-muted-foreground mt-1\">Separate with commas. Use * for all.</p>
                        </div >
                    </div >
                </div >

    {/* Security */ }
    < div className =\"glass-panel p-6 rounded-xl border border-white/10\">
        < h2 className =\"text-xl font-semibold mb-4 flex items-center gap-2\">
            < Shield className =\"text-red-400\" size={20} />
Security & Access
                    </h2 >
    <div className=\"flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5\">
        < div >
        <div className=\"font-medium\">Force HTTPS</div>
            < div className =\"text-sm text-muted-foreground\">Redirect all HTTP traffic to HTTPS</div>
                        </div >
    <div className=\"w-12 h-6 bg-primary rounded-full relative cursor-pointer\">
        < div className =\"absolute right-1 top-1 w-4 h-4 bg-white rounded-full\"></div>
                        </div >
                    </div >
                </div >

    <div className=\"flex justify-end gap-4\">
        < button
onClick = {() => fetchSettings()}
className =\"btn btn-secondary px-6 py-2 rounded-lg\"
disabled = { saving }
    >
    Cancel
                    </button >
    <button
        onClick={handleSave}
        className=\"btn btn-primary px-6 py-2 rounded-lg flex items-center gap-2\"
disabled = { saving }
    >
    <Save size={18} />
{ saving ? 'Saving...' : 'Save Changes' }
                    </button >
                </div >
            </div >
        </div >
    );
}
