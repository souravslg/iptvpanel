
import { fetchJTVPlaylist } from '../lib/jtv-scraper.js';
import { supabase } from '../lib/supabase.js';
import { parseM3U } from '../lib/m3u_v2.js';
import { supabaseAdmin } from '../lib/supabase-admin.js';

async function manualSync() {
    console.log('--- Starting Manual JTV Sync ---');

    // 0. Get URL from settings
    let targetUrl = null;
    const { data: urlSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'jtv_playlist_url')
        .single();

    if (urlSetting?.value) {
        targetUrl = urlSetting.value;
        console.log('Using configured URL:', targetUrl);
    } else {
        console.log('Using default URL (no setting found)');
    }

    try {
        const { content, metadata } = await fetchJTVPlaylist(targetUrl);
        console.log(`Fetched playlist. Size: ${content.length} bytes.`);

        // 1. Store content
        const { error: contentError } = await supabase
            .from('settings')
            .upsert({
                key: 'jtv_playlist_content',
                value: content
            }, { onConflict: 'key' });

        if (contentError) throw new Error('Failed to save playlist content: ' + contentError.message);
        console.log('Saved playlist content to DB.');

        // 2. Parse and Sync
        const streams = parseM3U(content);
        console.log(`Parsed ${streams.length} streams.`);

        if (streams.length > 0) {
            // Get or Create "JTV Auto-Gen" Playlist
            // using supabaseAdmin if available, or supabase (check if admin key needed for deletes?)
            // The route used supabaseAdmin.
            const db = supabaseAdmin || supabase;

            let { data: jtvPlaylist } = await db
                .from('playlists')
                .select('id')
                .eq('name', 'JTV Auto-Gen')
                .single();

            if (!jtvPlaylist) {
                console.log('Creating new playlist...');
                const { data: newPlaylist, error: createError } = await db
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
                console.log('Updating existing playlist...');
                await db
                    .from('playlists')
                    .update({
                        total_channels: streams.length,
                        updated_at: new Date().toISOString(),
                        is_active: true,
                        source_url: 'local:jtv.m3u'
                    })
                    .eq('id', jtvPlaylist.id);
            }

            console.log(`Playlist ID: ${jtvPlaylist.id}`);

            // Clear existing streams
            const { error: deleteError } = await db
                .from('streams')
                .delete()
                .eq('playlist_id', jtvPlaylist.id);

            if (deleteError) throw deleteError;
            console.log('Cleared old streams.');

            // Insert new streams
            const chunkSize = 1000;
            for (let i = 0; i < streams.length; i += chunkSize) {
                const chunk = streams.slice(i, i + chunkSize).map(stream => ({
                    stream_id: stream.id,
                    name: stream.name,
                    url: (() => {
                        let finalUrl = stream.url;
                        if (stream.headers && (stream.headers.Cookie || stream.headers.cookie)) {
                            const cookie = stream.headers.Cookie || stream.headers.cookie;
                            if (cookie.includes('__hdnea__=')) {
                                const token = cookie.split('__hdnea__=')[1].split(';')[0];
                                const separator = finalUrl.includes('?') ? '&' : '?';
                                if (!finalUrl.includes('__hdnea__=')) {
                                    finalUrl = `${finalUrl}${separator}__hdnea__=${token}`;
                                }
                            }
                        }
                        return finalUrl;
                    })(),
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

                const { error: insertError } = await db
                    .from('streams')
                    .insert(chunk);

                if (insertError) throw insertError;
                console.log(`Inserted chunk ${i} - ${i + chunk.length}`);
            }

            console.log('--- Sync Complete ---');
        }

    } catch (error) {
        console.error('Manual Sync Error:', error);
    }
}

manualSync();
