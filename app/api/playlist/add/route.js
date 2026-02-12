import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const {
            name,
            url,
            category,
            logo,
            streamFormat,
            drmScheme,
            drmLicenseUrl,
            drmKeyId,
            drmKey,
            headers,
            channelNumber
        } = await request.json();

        console.log('Add channel request received:', {
            name, url, category, logo, streamFormat, drmScheme, drmLicenseUrl, channelNumber
        });

        if (!name || !url) {
            console.log('Missing required fields');
            return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
        }

        // Get active playlist
        let { data: activePlaylists } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true)
            .limit(1);

        let playlistId = activePlaylists?.[0]?.id;

        // Fallback if no active playlist
        if (!playlistId) {
            const { data: anyPlaylist } = await supabase.from('playlists').select('id').limit(1).single();
            if (anyPlaylist) {
                playlistId = anyPlaylist.id;
            }
        }

        const channelData = {
            stream_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            url,
            logo: logo || null,
            category: category || 'Uncategorized',
            playlist_id: playlistId,
            stream_format: streamFormat || 'hls',
            drm_scheme: drmScheme || null,
            drm_license_url: drmLicenseUrl || null,
            drm_key_id: drmKeyId || null,
            drm_key: drmKey || null,
            channel_number: channelNumber ? parseInt(channelNumber) : null,
            enabled: true
        };

        const { data, error } = await supabase
            .from('streams')
            .insert([channelData])
            .select();

        console.log('Supabase insert result:', { data, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Add channel route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
