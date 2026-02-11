import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseM3U } from '@/lib/m3u_v2';

// POST - Import M3U content to a specific playlist
export async function POST(request) {
    try {
        const { playlistId, content, sourceUrl } = await request.json();

        if (!playlistId) {
            return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
        }

        if (!content) {
            return NextResponse.json({ error: 'M3U content is required' }, { status: 400 });
        }

        // Verify playlist exists
        const { data: playlist, error: playlistError } = await supabase
            .from('playlists')
            .select('*')
            .eq('id', playlistId)
            .single();

        if (playlistError || !playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        // Parse M3U content
        // Parse M3U content
        let streams = parseM3U(content);

        if (streams.length === 0) {
            return NextResponse.json({ error: 'No streams found in M3U content' }, { status: 400 });
        }

        // Ensure unique stream IDs to prevent 'streams_playlist_stream_unique' constraint violation
        const seenIds = new Set();
        const uniqueStreams = streams.map(stream => {
            let uniqueId = stream.id;
            // If ID already exists in this import batch, append a counter
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

        // Delete existing streams in this playlist
        await supabase
            .from('streams')
            .delete()
            .eq('playlist_id', playlistId);

        // Batch insert streams
        const chunkSize = 1000;
        for (let i = 0; i < streams.length; i += chunkSize) {
            const chunk = streams.slice(i, i + chunkSize).map(stream => ({
                stream_id: stream.id,
                name: stream.name,
                url: stream.url,
                logo: stream.logo,
                category: stream.group,
                playlist_id: playlistId,
                // DRM fields from M3U parser
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

        // Update playlist metadata
        await supabase
            .from('playlists')
            .update({
                source_url: sourceUrl || playlist.source_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', playlistId);

        return NextResponse.json({
            success: true,
            count: streams.length,
            playlistId
        });
    } catch (error) {
        console.error('Error importing to playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
