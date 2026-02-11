import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseM3U } from '@/lib/m3u_v2';

export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
        }

        // 1. Get playlist details
        const { data: playlist, error: playlistError } = await supabase
            .from('playlists')
            .select('*')
            .eq('id', id)
            .single();

        if (playlistError || !playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        if (!playlist.source_url) {
            return NextResponse.json({ error: 'Playlist has no source URL to refresh from' }, { status: 400 });
        }

        console.log(`Refreshing playlist "${playlist.name}" from: ${playlist.source_url}`);

        // 2. Fetch content from source URL
        const response = await fetch(playlist.source_url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json({
                error: `Failed to fetch from source URL: ${response.statusText}`
            }, { status: response.status });
        }

        const content = await response.text();

        if (!content || content.length === 0) {
            return NextResponse.json({ error: 'Empty response from source URL' }, { status: 400 });
        }

        // 3. Parse M3U content
        let streams = parseM3U(content);

        if (streams.length === 0) {
            return NextResponse.json({ error: 'No streams found in source content' }, { status: 400 });
        }

        // 4. Deduplicate stream IDs
        const seenIds = new Set();
        const uniqueStreams = streams.map(stream => {
            let uniqueId = stream.id;
            if (seenIds.has(uniqueId)) {
                let counter = 1;
                while (seenIds.has(`${stream.id}_${counter}`)) {
                    counter++;
                }
                uniqueId = `${stream.id}_${counter}`;
            }
            seenIds.add(uniqueId);
            return { ...stream, id: uniqueId };
        });
        streams = uniqueStreams;

        // 5. Update database (Transaction-like: delete then insert)

        // Delete existing streams
        const { error: deleteError } = await supabase
            .from('streams')
            .delete()
            .eq('playlist_id', id);

        if (deleteError) throw deleteError;

        // Batch insert new streams
        const chunkSize = 1000;
        for (let i = 0; i < streams.length; i += chunkSize) {
            const chunk = streams.slice(i, i + chunkSize).map(stream => ({
                stream_id: stream.id,
                name: stream.name,
                url: stream.url,
                logo: stream.logo,
                category: stream.group,
                playlist_id: id,
                drm_scheme: stream.drmScheme || null,
                drm_license_url: stream.drmLicenseUrl || null,
                drm_key_id: stream.drmKeyId || null,
                drm_key: stream.drmKey || null,
                stream_format: stream.streamFormat || 'hls',
                channel_number: stream.channelNumber || null,
                headers: stream.headers || null
            }));

            const { error: insertError } = await supabase
                .from('streams')
                .insert(chunk);

            if (insertError) throw insertError;
        }

        // 6. Update playlist metadata
        await supabase
            .from('playlists')
            .update({
                total_channels: streams.length,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            count: streams.length,
            message: `Successfully refreshed ${streams.length} channels`
        });

    } catch (error) {
        console.error('Error refreshing playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
