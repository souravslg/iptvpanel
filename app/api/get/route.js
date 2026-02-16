import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const password = searchParams.get('password');

        if (!username || !password) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Authenticate user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check if user is active
        const now = new Date();
        const expireDate = user.expire_date ? new Date(user.expire_date) : null;
        const isExpired = expireDate && expireDate < now;
        const isActive = user.status === 'Active' && !isExpired;

        if (!isActive) {
            // Fetch invalid subscription video URL
            let invalidVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            try {
                const { data: settingsData } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'invalid_subscription_video')
                    .single();
                if (settingsData?.value) invalidVideoUrl = settingsData.value;
            } catch (e) {
                console.error('Error fetching invalid video setting:', e);
            }

            const m3u = `#EXTM3U\n#EXTINF:-1 tvg-id="" tvg-name="Account Expired" tvg-logo="" group-title="System",Account Expired/Inactive\n${invalidVideoUrl}\n`;

            return new NextResponse(m3u, {
                headers: {
                    'Content-Type': 'application/x-mpegURL',
                    'Content-Disposition': `attachment; filename="${username}.m3u"`
                }
            });
        }

        // Get active playlists
        const { data: activePlaylists } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true);

        // Fetch stream_mode setting
        let streamMode = 'proxy';
        try {
            const { data: modeData } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'stream_mode')
                .single();
            if (modeData?.value) streamMode = modeData.value;
        } catch (e) {
            console.error('Error fetching stream_mode:', e);
        }

        if (!activePlaylists || activePlaylists.length === 0) {
            return new NextResponse('#EXTM3U\n', {
                headers: {
                    'Content-Type': 'application/x-mpegURL',
                    'Content-Disposition': `attachment; filename="${username}.m3u"`
                }
            });
        }

        const playlistIds = activePlaylists.map(p => p.id);

        // Fetch all streams
        let allStreams = [];
        let hasMore = true;
        let offset = 0;
        const batchSize = 1000;

        while (hasMore) {
            const { data: batch, error: batchError } = await supabase
                .from('streams')
                .select('*')
                .in('playlist_id', playlistIds)
                .eq('enabled', true) // Only include enabled channels
                .order('id', { ascending: true })
                .range(offset, offset + batchSize - 1);

            if (batchError || !batch || batch.length === 0) {
                hasMore = false;
            } else {
                allStreams = allStreams.concat(batch);
                offset += batchSize;
                hasMore = batch.length === batchSize;
            }
        }

        // Determine extension based on output param
        const output = searchParams.get('output'); // m3u8 or ts
        const extension = (output === 'm3u8' || output === 'hls') ? 'm3u8' : 'ts';

        // Generate M3U
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';

        let m3u = '#EXTM3U\n';

        allStreams.forEach(stream => {
            const tvgId = stream.stream_id || stream.id;
            const tvgName = stream.name;
            const tvgLogo = stream.logo || '';
            const groupTitle = stream.category || 'Uncategorized';

            // ... (DRM and Header logic preserved in omitted lines if not replaced, wait, I need to keep the DRM logic)
            // Ideally I should only replace the URL line, but the DRM logic is inside the loop.
            // I will replace the generation block.
            // M3U Tag Order (CRITICAL for TiviMate):
            // 1. #EXTINF (channel info) - MUST be first
            // 2. #KODIPROP (DRM keys)
            // 3. #EXTVLCOPT (user-agent)
            // 4. #EXTHTTP (cookies)
            // 5. URL

            // 1. Channel Info - MUST be first
            m3u += `#EXTINF:-1 tvg-id=\"${tvgId}\" tvg-name=\"${tvgName}\" tvg-logo=\"${tvgLogo}\" group-title=\"${groupTitle}\", ${tvgName}\n`;

            // 2. DRM Keys (if present)
            if (stream.drm_scheme === 'clearkey' && stream.drm_key_id && stream.drm_key) {
                // TiviMate wants "clearkey" not "org.w3.clearkey"
                m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
                m3u += `#KODIPROP:inputstream.adaptive.license_key=${stream.drm_key_id}:${stream.drm_key}\n`;
            }

            // 3. User-Agent (if present)
            if (stream.headers) {
                const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                const getHeader = (key) => headers[key] || headers[key.toLowerCase()];
                const ua = getHeader('User-Agent');

                if (ua) {
                    m3u += `#EXTVLCOPT:http-user-agent=${ua}\n`;
                }

                // 4. Cookie (MUST be after EXTVLCOPT for TiviMate)
                const cookie = getHeader('Cookie');
                if (cookie) {
                    m3u += `#EXTHTTP:{\"cookie\":\"${cookie}\"}\n`;
                }
            }

            // 5. Final Stream URL
            // Use correct extension from stream_format
            let extension = 'ts';
            if (stream.stream_format === 'mpd') extension = 'mpd';
            else if (stream.stream_format === 'm3u8') extension = 'm3u8';
            else if (stream.type === 'movie') extension = 'mp4';

            // Fallback: if output param forced m3u8, use it (unless it's mpd which shouldn't be forced to m3u8)
            const output = searchParams.get('output');
            if ((output === 'm3u8' || output === 'hls') && extension !== 'mpd') {
                extension = 'm3u8';
            }

            const sId = stream.stream_id || stream.id;
            let finalUrl = `${protocol}://${host}/live/${username}/${password}/${sId}.${extension}`;

            // If Direct Mode, use the source URL WITHOUT pipe headers
            // TiviMate reads #EXTHTTP tags, NOT pipe headers in the URL
            if (streamMode === 'direct' && stream.url) {
                // Use clean URL - headers are in #EXTHTTP tag above
                finalUrl = stream.url;
            }

            m3u += `${finalUrl}\n`;
        });

        return new NextResponse(m3u, {
            headers: {
                'Content-Type': 'application/x-mpegURL',
                'Content-Disposition': `attachment; filename="${username}.m3u"`
            }
        });
    } catch (error) {
        console.error('M3U error:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}
