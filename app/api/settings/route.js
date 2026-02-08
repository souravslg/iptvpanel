import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch settings
export async function GET() {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        // Return default settings if none exist
        if (!settings) {
            return NextResponse.json({
                invalid_subscription_video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                server_name: 'IPTV Panel',
                server_url: ''
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT - Update settings
export async function PUT(request) {
    try {
        const body = await request.json();
        const { invalid_subscription_video, server_name, server_url } = body;

        // Check if settings exist
        const { data: existing } = await supabase
            .from('settings')
            .select('id')
            .single();

        let result;
        if (existing) {
            // Update existing settings
            result = await supabase
                .from('settings')
                .update({
                    invalid_subscription_video,
                    server_name,
                    server_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            // Insert new settings
            result = await supabase
                .from('settings')
                .insert([{
                    invalid_subscription_video,
                    server_name,
                    server_url
                }])
                .select()
                .single();
        }

        if (result.error) throw result.error;

        return NextResponse.json(result.data);
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
