'use client';

import { Save, Server, Globe, Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">Configure your panel preferences and server defaults.</p>
            </div>

            <div className="grid gap-8">
                {/* General Settings */}
                <div className="glass-panel p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Globe className="text-primary" size={20} />
                        General
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Panel Name</label>
                            <input type="text" defaultValue="SRV IPTV Panel" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Support Email</label>
                            <input type="email" defaultValue="support@srv-iptv.com" />
                        </div>
                    </div>
                </div>

                {/* Streaming Settings */}
                <div className="glass-panel p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Server className="text-green-500" size={20} />
                        Streaming Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Default Stream Format</label>
                            <select>
                                <option>HLS (m3u8)</option>
                                <option>MPEG-TS (ts)</option>
                                <option>RTMP</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Connections Per User</label>
                            <input type="number" defaultValue="1" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Allowed User Agents</label>
                            <textarea rows="3" defaultValue="VLC, Kodi, IPTVSmarters, *" />
                            <p className="text-xs text-muted-foreground mt-1">Separate with commas. Use * for all.</p>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="glass-panel p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="text-red-400" size={20} />
                        Security & Access
                    </h2>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                            <div className="font-medium">Force HTTPS</div>
                            <div className="text-sm text-muted-foreground">Redirect all HTTP traffic to HTTPS</div>
                        </div>
                        <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button className="btn btn-secondary px-6 py-2 rounded-lg">Cancel</button>
                    <button className="btn btn-primary px-6 py-2 rounded-lg flex items-center gap-2">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
