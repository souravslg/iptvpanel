
import { NextResponse } from 'next/server';
import { fetchJTVPlaylist } from '@/lib/jtv-scraper';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseM3U } from '@/lib/m3u';
import fs from 'fs';
import path from 'path';

export async function POST() {
    try {
        const { content, metadata } = await fetchJTVPlaylist();

        // 1. Store M3U Content
        const { error: contentError } = await supabase
            .from('settings')
            .upsert({
                key: 'jtv_playlist_content',
                value: content
            }, { onConflict: 'key' });

        if (contentError) throw new Error('Failed to save playlist content: ' + contentError.message);

        // 1.5 Write to public/jtv.m3u for Sync and Download
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        const filePath = path.join(publicDir, 'jtv.m3u');
        fs.writeFileSync(filePath, content, 'utf8');

        // 2. Store Metadata (last updated, status, etc.)
        const { error: metaError } = await supabase
            .from('settings')
            .upsert({
                key: 'jtv_metadata',
                value: JSON.stringify({
                    ...metadata,
                    size: fs.statSync(filePath).size // Update size from actual file
                })
            }, { onConflict: 'key' });

        if (metaError) throw new Error('Failed to save metadata: ' + metaError.message);

        // 3. Sync to Playlist Manager (parse M3U and insert streams)
        console.log('Syncing streams to database...');
        const streams = parseM3U(content);

        if (streams.length > 0) {
            // Get or Create "JTV Auto-Gen" Playlist
            let { data: jtvPlaylist } = await supabaseAdmin
                .from('playlists')
                .select('id')
                .eq('name', 'JTV Auto-Gen')
                .single();

            if (!jtvPlaylist) {
                const { data: newPlaylist, error: createError } = await supabaseAdmin
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
                await supabaseAdmin
                    .from('playlists')
                    .update({
                        total_channels: streams.length,
                        updated_at: new Date().toISOString(),
                        is_active: true
                    })
                    .eq('id', jtvPlaylist.id);
            }

            // Clear existing streams in this playlist
            const { error: deleteError } = await supabaseAdmin
                .from('streams')
                .delete()
                .eq('playlist_id', jtvPlaylist.id);

            if (deleteError) throw deleteError;

            // Batch Insert New Streams
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
                    channel_number: stream.channelNumber || null
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('streams')
                    .insert(chunk);

                if (insertError) throw insertError;
            }

            console.log(`✓ Synced ${streams.length} streams to "JTV Auto-Gen" playlist`);
        }

        return NextResponse.json({
            success: true,
            message: `Playlist updated, saved to DB, written to file, and synced ${streams.length} streams successfully`
        });
    } catch (error) {
        console.error('JTV Refresh Error:', error);

        // Try to save error state to DB
        try {
            await supabase.from('settings').upsert({
                key: 'jtv_metadata',
                value: JSON.stringify({
                    lastUpdated: new Date().toISOString(),
                    status: 'Error',
                    error: error.message
                })
            }, { onConflict: 'key' });
        } catch (e) { /* ignore */ }

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
