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


            // 1. DRM Properties (Kodi / Standard HLS)
            if (stream.drm_scheme === 'clearkey' && stream.drm_key_id && stream.drm_key) {
                const toBase64Url = (s) => {
                    try {
                        if (s && /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
                            return Buffer.from(s, 'hex').toString('base64url');
                        }
                        return s;
                    } catch (e) { return s; }
                };
                const k = toBase64Url(stream.drm_key);
                const kid = toBase64Url(stream.drm_key_id);

                m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
                m3u += `#KODIPROP:inputstream.adaptive.license_key={"keys":[{"kty":"oct","k":"${k}","kid":"${kid}"}],"type":"temporary"}\n`;

                const keyJson = JSON.stringify({ keys: [{ kty: 'oct', k: k, kid: kid }], type: 'temporary' });
                const keyBase64 = Buffer.from(keyJson).toString('base64');
                m3u += `#EXT-X-KEY:METHOD=SAMPLE-AES,URI="data:text/plain;base64,${keyBase64}",KEYFORMAT="clearkey",KEYFORMATVERSIONS="1"\n`;

            } else if (stream.drm_scheme === 'widevine' && stream.drm_license_url) {
                let licenseUrl = stream.drm_license_url;
                if (stream.headers) {
                    const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                    const headerParts = [];
                    const getHeader = (key) => headers[key] || headers[key.toLowerCase()];
                    const ua = getHeader('User-Agent');
                    if (ua) headerParts.push(`User-Agent=${ua}`);
                    const ref = getHeader('Referer') || getHeader('Origin');
                    if (ref) headerParts.push(`Referer=${ref}`);

                    if (headerParts.length > 0) licenseUrl += `|${headerParts.join('&')}`;
                }

                m3u += `#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha\n`;
                m3u += `#KODIPROP:inputstream.adaptive.license_key=${licenseUrl}\n`;
                m3u += `#EXT-X-KEY:METHOD=SAMPLE-AES,URI="${licenseUrl}",KEYFORMAT="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed",KEYFORMATVERSIONS="1"\n`;
            }

            // 2. HTTP Headers (User-Agent, Referer, Origin)
            if (stream.headers) {
                const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                const getHeader = (key) => headers[key] || headers[key.toLowerCase()];
                const ua = getHeader('User-Agent');
                const ref = getHeader('Referer');
                const org = getHeader('Origin');

                if (ua) m3u += `#EXTVLCOPT:http-user-agent=${ua}\n`;
                if (ref) m3u += `#EXTVLCOPT:http-referrer=${ref}\n`;

                const kodiHeaders = [];
                if (ua) kodiHeaders.push(`User-Agent=${ua}`);
                if (ref) kodiHeaders.push(`Referer=${ref}`);
                if (org) kodiHeaders.push(`Origin=${org}`);
                if (kodiHeaders.length > 0) {
                    m3u += `#KODIPROP:inputstream.adaptive.stream_headers=${kodiHeaders.join('&')}\n`;
                }
            }

            // 3. Channel Info
            m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${tvgName}\n`;

            // 4. Final Stream URL (Must be immediately after EXTINF)
            let finalUrl = `${protocol}://${host}/live/${username}/${password}/${encodeURIComponent(tvgId)}.${extension}`;

            if (stream.headers) {
                const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                const headerParts = [];
                const getHeader = (key) => headers[key] || headers[key.toLowerCase()];
                const ua = getHeader('User-Agent');
                if (ua) headerParts.push(`User-Agent=${ua}`);
                const ref = getHeader('Referer') || getHeader('Origin');
                if (ref) headerParts.push(`Referer=${ref}`);
                if (headerParts.length > 0) finalUrl += `|${headerParts.join('&')}`;
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
