import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseM3U } from '@/lib/m3u_v2';

const JIOTV_PLAYLIST_NAME = 'JioTV Server';
const SETTINGS_KEY = 'jiotv_server';

export async function POST(request) {
    try {
        const body = await request.json();
        let { m3uUrl, serverUrl } = body;

        // If not provided, load from settings
        if (!m3uUrl) {
            const { data: settingData } = await supabase
                .from('settings')
                .select('value')
                .eq('key', SETTINGS_KEY)
                .single();

            if (!settingData?.value) {
                return NextResponse.json({ error: 'No JioTV server configured' }, { status: 400 });
            }
            const config = JSON.parse(settingData.value);
            m3uUrl = config.m3uUrl;
            serverUrl = config.serverUrl;
        }

        if (!m3uUrl) {
            return NextResponse.json({ error: 'M3U URL could not be determined' }, { status: 400 });
        }

        console.log(`[JioTV Sync] Fetching: ${m3uUrl}`);

        // Fetch M3U from JioTV server
        let content;
        try {
            const res = await fetch(m3uUrl, {
                headers: { 'User-Agent': 'IPTV-Panel/1.0' },
                signal: AbortSignal.timeout(30000)
            });
            if (!res.ok) {
                return NextResponse.json({
                    error: `JioTV server returned ${res.status}: ${res.statusText}. Make sure the server is running and accessible.`
                }, { status: 502 });
            }
            content = await res.text();
        } catch (fetchError) {
            console.error('[JioTV Sync] Fetch error:', fetchError);
            return NextResponse.json({
                error: `Cannot reach JioTV server: ${fetchError.message}. Ensure the server URL is correct and the server is running.`
            }, { status: 502 });
        }

        if (!content || content.length < 20) {
            return NextResponse.json({ error: 'Empty or invalid M3U response from server' }, { status: 400 });
        }

        // Parse M3U
        const streams = parseM3U(content);
        if (streams.length === 0) {
            return NextResponse.json({ error: 'No channels found in JioTV playlist' }, { status: 400 });
        }

        console.log(`[JioTV Sync] Parsed ${streams.length} channels`);

        // Find or create the JioTV Server playlist
        let { data: existing } = await supabase
            .from('playlists')
            .select('id')
            .eq('name', JIOTV_PLAYLIST_NAME)
            .single();

        let playlistId;
        if (existing) {
            playlistId = existing.id;
        } else {
            const { data: newPlaylist, error: createErr } = await supabase
                .from('playlists')
                .insert({
                    name: JIOTV_PLAYLIST_NAME,
                    description: `Auto-synced from JioTV server: ${serverUrl || ''}`,
                    source_url: m3uUrl,
                    is_active: false,
                    total_channels: 0
                })
                .select('id')
                .single();

            if (createErr) throw createErr;
            playlistId = newPlaylist.id;
        }

        // Update source_url in case it changed
        await supabase
            .from('playlists')
            .update({ source_url: m3uUrl, description: `Auto-synced from JioTV server: ${serverUrl || ''}` })
            .eq('id', playlistId);

        // Delete old streams
        const { error: deleteErr } = await supabase
            .from('streams')
            .delete()
            .eq('playlist_id', playlistId);

        if (deleteErr) throw deleteErr;

        // Deduplicate stream IDs
        const seenIds = new Set();
        const uniqueStreams = streams.map(stream => {
            let uid = stream.id;
            if (seenIds.has(uid)) {
                let c = 1;
                while (seenIds.has(`${uid}_${c}`)) c++;
                uid = `${uid}_${c}`;
            }
            seenIds.add(uid);
            return { ...stream, id: uid };
        });

        // Batch insert
        const chunkSize = 500;
        for (let i = 0; i < uniqueStreams.length; i += chunkSize) {
            const chunk = uniqueStreams.slice(i, i + chunkSize).map(s => ({
                stream_id: s.id,
                name: s.name,
                url: s.url,
                logo: s.logo || null,
                category: s.group || 'JioTV',
                playlist_id: playlistId,
                drm_scheme: s.drmScheme || null,
                drm_license_url: s.drmLicenseUrl || null,
                drm_key_id: s.drmKeyId || null,
                drm_key: s.drmKey || null,
                stream_format: s.streamFormat || 'hls',
                channel_number: s.channelNumber || null,
                headers: s.headers || null
            }));
            const { error: insertErr } = await supabase.from('streams').insert(chunk);
            if (insertErr) throw insertErr;
        }

        // Update playlist metadata + last sync time in settings
        const now = new Date().toISOString();
        await supabase
            .from('playlists')
            .update({ total_channels: uniqueStreams.length, updated_at: now })
            .eq('id', playlistId);

        // Save last sync info to settings
        try {
            const { data: settingData } = await supabase
                .from('settings')
                .select('value')
                .eq('key', SETTINGS_KEY)
                .single();
            if (settingData?.value) {
                const cfg = JSON.parse(settingData.value);
                cfg.lastSyncedAt = now;
                cfg.lastSyncCount = uniqueStreams.length;
                cfg.playlistId = playlistId;
                await supabase
                    .from('settings')
                    .update({ value: JSON.stringify(cfg) })
                    .eq('key', SETTINGS_KEY);
            }
        } catch (_) { /* non-critical */ }

        return NextResponse.json({
            success: true,
            count: uniqueStreams.length,
            playlistId,
            syncedAt: now,
            message: `Successfully synced ${uniqueStreams.length} JioTV channels`
        });

    } catch (error) {
        console.error('[JioTV Sync] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - trigger sync from saved config (for cron/auto-refresh)
export async function GET() {
    return POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }));
}
