import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const password = searchParams.get('password');

        console.log('M3U request:', { username, password });

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
            return new NextResponse('Account expired or inactive', { status: 401 });
        }

        // Get active playlists first
        const { data: activePlaylists, error: playlistError } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true);

        if (playlistError || !activePlaylists || activePlaylists.length === 0) {
            console.log('No active playlists found');
            return new NextResponse('#EXTM3U\n', {
                headers: {
                    'Content-Type': 'application/x-mpegURL',
                    'Content-Disposition': `attachment; filename="${username}.m3u"`
                }
            });
        }

        const playlistIds = activePlaylists.map(p => p.id);
        console.log('Fetching streams from active playlists:', playlistIds);

        // Fetch all streams from active playlists using batch pagination
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

            if (batchError) {
                console.error('Error fetching streams batch:', batchError);
                break;
            }

            if (batch && batch.length > 0) {
                allStreams = allStreams.concat(batch);
                offset += batchSize;
                hasMore = batch.length === batchSize;
            } else {
                hasMore = false;
            }
        }

        console.log(`Fetched ${allStreams.length} streams from ${activePlaylists.length} active playlist(s)`);

        // Generate M3U playlist
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const useProxy = searchParams.get('proxy') === 'true';

        let m3u = '#EXTM3U\n';

        allStreams.forEach(stream => {
            const tvgId = stream.stream_id || stream.id;
            const tvgName = stream.name;
            const tvgLogo = stream.logo || '';
            const groupTitle = stream.category || 'Uncategorized';

            // Add DRM information if stream has ClearKey DRM
            if (stream.drm_scheme === 'clearkey' && stream.drm_key_id && stream.drm_key) {
                m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;

                // Helper to convert Hex to Base64URL (required for JSON Key format)
                const toBase64Url = (str) => {
                    try {
                        if (str && /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0) {
                            return Buffer.from(str, 'hex').toString('base64url');
                        }
                        return str;
                    } catch (e) {
                        return str;
                    }
                };

                const k = toBase64Url(stream.drm_key);
                const kid = toBase64Url(stream.drm_key_id);

                m3u += `#KODIPROP:inputstream.adaptive.license_key={"keys":[{"kty":"oct","k":"${k}","kid":"${kid}"}],"type":"temporary"}\n`;

                // Standard HLS ClearKey format
                const keyJson = JSON.stringify({ keys: [{ kty: 'oct', k: k, kid: kid }], type: 'temporary' });
                const keyBase64 = Buffer.from(keyJson).toString('base64');
                m3u += `#EXT-X-KEY:METHOD=SAMPLE-AES,URI="data:text/plain;base64,${keyBase64}",KEYFORMAT="clearkey",KEYFORMATVERSIONS="1"\n`;
            } else if (stream.drm_scheme === 'widevine' && stream.drm_license_url) {
                // Check if we need to append headers to the license URL (for Kodi/OTT Navigator)
                let licenseUrl = stream.drm_license_url;
                if (stream.headers) {
                    const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                    const headerParts = [];

                    // Helper to handle case-insensitive headers
                    const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

                    const ua = getHeader('User-Agent');
                    if (ua) headerParts.push(`User-Agent=${ua}`);

                    const ref = getHeader('Referer');
                    if (ref) headerParts.push(`Referer=${ref}`);

                    if (headerParts.length > 0) {
                        licenseUrl += `|${headerParts.join('&')}`;
                    }
                }

                m3u += `#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha\n`;
                m3u += `#KODIPROP:inputstream.adaptive.license_key=${licenseUrl}\n`;

                // Standard Widevine HLS tag
                m3u += `#EXT-X-KEY:METHOD=SAMPLE-AES,URI="${licenseUrl}",KEYFORMAT="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed",KEYFORMATVERSIONS="1"\n`;
            }

            // Add headers (User-Agent, etc)
            if (stream.headers) {
                const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

                // User-Agent (Common for Kodi/VLC)
                const ua = getHeader('User-Agent');
                if (ua) {
                    m3u += `#EXTVLCOPT:http-user-agent=${ua}\n`;
                    m3u += `#KODIPROP:inputstream.adaptive.stream_headers=User-Agent=${ua}\n`;
                }

                // Referer
                const ref = getHeader('Referer');
                if (ref) {
                    m3u += `#EXTVLCOPT:http-referrer=${ref}\n`;
                    // For Kodi referer is sometimes separate or part of stream_headers
                }
            }

            m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${tvgName}\n`;

            // Always use proxy URL to enforce authentication and expiry checks
            const streamUrl = `${protocol}://${host}/live/${username}/${password}/${encodeURIComponent(tvgId)}.m3u8`;
            m3u += `${streamUrl}\n`;
        });

        return new NextResponse(m3u, {
            headers: {
                'Content-Type': 'application/x-mpegURL',
                'Content-Disposition': `attachment; filename="${username}.m3u"`
            }
        });
    } catch (error) {
        console.error('M3U generation error:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}
