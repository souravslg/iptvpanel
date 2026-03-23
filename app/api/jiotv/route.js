import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const JIOTV_SETTINGS_KEY = 'jiotv_server';

// GET – return stored JioTV server config
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', JIOTV_SETTINGS_KEY)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        const config = data?.value ? JSON.parse(data.value) : null;
        return NextResponse.json({ config });
    } catch (error) {
        console.error('GET /api/jiotv error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST – save config and trigger sync
export async function POST(request) {
    try {
        const { serverUrl, quality, language } = await request.json();

        if (!serverUrl || !serverUrl.trim()) {
            return NextResponse.json({ error: 'Server URL is required' }, { status: 400 });
        }

        const trimmedUrl = serverUrl.trim().replace(/\/$/, ''); // strip trailing slash

        // Build M3U URL
        const params = new URLSearchParams();
        if (quality && quality !== 'auto') params.set('q', quality);
        if (language && language.trim()) params.set('l', language.trim());
        const m3uUrl = `${trimmedUrl}/playlist.m3u${params.toString() ? '?' + params.toString() : ''}`;

        // Save config to settings
        const configValue = JSON.stringify({ serverUrl: trimmedUrl, quality, language, m3uUrl });

        const { error: upsertError } = await supabase
            .from('settings')
            .upsert({ key: JIOTV_SETTINGS_KEY, value: configValue }, { onConflict: 'key' });

        if (upsertError) throw upsertError;

        // Trigger sync
        const syncRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jiotv/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ m3uUrl, serverUrl: trimmedUrl })
        });

        const syncData = await syncRes.json();

        if (!syncRes.ok) {
            return NextResponse.json({ error: syncData.error || 'Config saved but sync failed' }, { status: 200 });
        }

        return NextResponse.json({ success: true, ...syncData });
    } catch (error) {
        console.error('POST /api/jiotv error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
