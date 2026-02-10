
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const cron = await import('node-cron');
        const { fetchJTVPlaylist } = await import('./lib/jtv-scraper');
        const { supabaseAdmin } = await import('./lib/supabase-admin');
        const { parseM3U } = await import('./lib/m3u');
        const fs = await import('fs');
        const path = await import('path');

        console.log('Initializing JTV Auto-Refresh Scheduler...');

        // Schedule task to run every 2 hours
        // Cron syntax: minute hour day-of-month month day-of-week
        // Pattern: 0 */2 * * * means every 2 hours on the hour
        cron.default.schedule('0 */2 * * *', async () => {
            console.log('Running scheduled JTV playlist refresh...');
            try {
                // 1. Fetch the playlist content
                const { content, metadata } = await fetchJTVPlaylist();

                // 2. Store M3U Content in database
                const { error: contentError } = await supabaseAdmin
                    .from('settings')
                    .upsert({
                        key: 'jtv_playlist_content',
                        value: content
                    }, { onConflict: 'key' });

                if (contentError) {
                    throw new Error('Failed to save playlist content: ' + contentError.message);
                }

                // 3. Write to public/jtv.m3u for downloads
                const publicDir = path.default.join(process.cwd(), 'public');
                if (!fs.default.existsSync(publicDir)) {
                    fs.default.mkdirSync(publicDir, { recursive: true });
                }
                const filePath = path.default.join(publicDir, 'jtv.m3u');
                fs.default.writeFileSync(filePath, content, 'utf8');

                // 4. Store Metadata with updated file size
                const { error: metaError } = await supabaseAdmin
                    .from('settings')
                    .upsert({
                        key: 'jtv_metadata',
                        value: JSON.stringify({
                            ...metadata,
                            size: fs.default.statSync(filePath).size
                        })
                    }, { onConflict: 'key' });

                if (metaError) {
                    throw new Error('Failed to save metadata: ' + metaError.message);
                }

                // 5. Sync to Playlist Manager (parse M3U and insert streams)
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

                console.log('✓ Scheduled JTV playlist refresh completed successfully');
            } catch (error) {
                console.error('Scheduled refresh failed:', error);

                // Try to save error state to database
                try {
                    await supabaseAdmin.from('settings').upsert({
                        key: 'jtv_metadata',
                        value: JSON.stringify({
                            lastUpdated: new Date().toISOString(),
                            status: 'Error',
                            error: error.message
                        })
                    }, { onConflict: 'key' });
                } catch (e) {
                    console.error('Failed to save error state:', e);
                }
            }
        });

        console.log('JTV Auto-Refresh Scheduler initialized (Every 2 hours)');
    }
}
