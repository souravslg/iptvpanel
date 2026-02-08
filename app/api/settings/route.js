import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch settings from key-value table
export async function GET() {
    try {
        const { data: settingsRows, error } = await supabase
            .from('settings')
            .select('*')
            .in('key', ['invalid_subscription_video', 'server_name', 'server_url']);

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // Convert key-value rows to object
        const settings = {
            invalid_subscription_video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            server_name: 'IPTV Panel',
            server_url: ''
        };

        if (settingsRows) {
            settingsRows.forEach(row => {
                settings[row.key] = row.value;
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT - Update settings in key-value table
export async function PUT(request) {
    try {
        const body = await request.json();
        const { invalid_subscription_video, server_name, server_url } = body;

        const updates = [];

        if (invalid_subscription_video !== undefined) {
            updates.push({ key: 'invalid_subscription_video', value: invalid_subscription_video });
        }
        if (server_name !== undefined) {
            updates.push({ key: 'server_name', value: server_name });
        }
        if (server_url !== undefined) {
            updates.push({ key: 'server_url', value: server_url });
        }

        // Upsert each setting
        for (const setting of updates) {
            const { error } = await supabase
                .from('settings')
                .upsert(setting, { onConflict: 'key' });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

