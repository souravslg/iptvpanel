import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseM3U } from '@/lib/m3u_v2';

export async function POST() {
    try {
        // 1. Get content from DB
        const { data: setting, error: settingError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'jtv_playlist_content')
            .single();

        if (settingError || !setting?.value) {
            return NextResponse.json({ error: 'JTV playlist not found in database. Please refresh it first.' }, { status: 404 });
        }

        const content = setting.value;
        const streams = parseM3U(content);

        if (streams.length === 0) {
            return NextResponse.json({ error: 'No streams found in JTV playlist' }, { status: 400 });
        }

        // 1. Get or Create "JTV Auto-Gen" Playlist
        let { data: jtvPlaylist } = await supabase
            .from('playlists')
            .select('id')
            .eq('name', 'JTV Auto-Gen')
            .single();

        if (!jtvPlaylist) {
            const { data: newPlaylist, error: createError } = await supabase
                .from('playlists')
                .insert({
                    name: 'JTV Auto-Gen',
                    description: 'Auto-generated JTV playlist',
                    is_active: true,
                    total_channels: streams.length,
                    source_url: 'local:jtv.m3u'
                })
                .select('id')
                .single();

            if (createError) throw createError;
            jtvPlaylist = newPlaylist;
        } else {
            // Update metadata if exists
            await supabase
                .from('playlists')
                .update({
                    total_channels: streams.length,
                    updated_at: new Date().toISOString(),
                    is_active: true
                })
                .eq('id', jtvPlaylist.id);
        }

        // 2. Clear existing streams in this playlist
        const { error: deleteError } = await supabase
            .from('streams')
            .delete()
            .eq('playlist_id', jtvPlaylist.id);

        if (deleteError) throw deleteError;

        // 3. Batch Insert New Streams
        const chunkSize = 1000;
        for (let i = 0; i < streams.length; i += chunkSize) {
            const chunk = streams.slice(i, i + chunkSize).map(stream => ({
                stream_id: stream.id,
                name: stream.name,
                url: stream.url,
                logo: stream.logo,
                category: stream.group,
                playlist_id: jtvPlaylist.id,
                drm_scheme: stream.drmScheme || null,
                drm_license_url: stream.drmLicenseUrl || null,
                drm_key_id: stream.drmKeyId || null,
                drm_key: stream.drmKey || null,
                stream_format: stream.streamFormat || 'hls',
                channel_number: stream.channelNumber || null,
                headers: stream.headers ? JSON.stringify(stream.headers) : null
            }));

            const { error: insertError } = await supabase
                .from('streams')
                .insert(chunk);

            if (insertError) throw insertError;
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${streams.length} channels to "JTV Auto-Gen" playlist`
        });

    } catch (error) {
        console.error('JTV Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
