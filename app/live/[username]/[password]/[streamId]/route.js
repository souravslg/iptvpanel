import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, context) {
    const params = await Promise.resolve(context.params);
    const { username, password, streamId } = params;

    if (!username || !password || !streamId) {
        return new NextResponse('Invalid request parameters', { status: 400 });
    }

    const cleanStreamId = decodeURIComponent(streamId.replace(/(\.(ts|m3u8|mp4))?(\|.*|%7c.*)?$/i, ''));

    try {
        console.log('--- Smart Stream Proxy Start ---');
        console.log('Request:', { username, streamId: cleanStreamId });

        // 1. Authenticate User
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (!user || user.status !== 'Active') {
            return new NextResponse('Unauthorized or Inactive', { status: 401 });
        }

        const now = new Date();
        const expireDate = user.expire_date ? new Date(user.expire_date) : null;
        if (expireDate && expireDate < now) {
            return new NextResponse('Subscription Expired', { status: 401 });
        }

        // 2. Fetch Stream Data
        const { data: activePlaylists } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true);

        if (!activePlaylists || activePlaylists.length === 0) {
            return new NextResponse('No active playlists', { status: 404 });
        }

        const playlistIds = activePlaylists.map(p => p.id);
        const isNumeric = /^\d+$/.test(cleanStreamId);
        let query = supabase.from('streams').select('*').in('playlist_id', playlistIds);

        if (isNumeric) {
            query = query.or(`id.eq.${cleanStreamId},stream_id.eq.${cleanStreamId}`);
        } else {
            query = query.eq('stream_id', cleanStreamId);
        }

        const { data: streams } = await query;
        if (!streams || streams.length === 0) {
            return new NextResponse('Stream not found', { status: 404 });
        }

        const stream = streams[0];
        let targetUrl = stream.url;

        if (!targetUrl) return new NextResponse('Missing target URL', { status: 500 });

        // 3. Prepare Headers for Fetch
        const fetchHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (stream.headers) {
            const storedHeaders = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            const getStored = (k) => storedHeaders[k] || storedHeaders[k.toLowerCase()];

            if (getStored('User-Agent')) fetchHeaders['User-Agent'] = getStored('User-Agent');
            if (getStored('Referer')) fetchHeaders['Referer'] = getStored('Referer');
            if (getStored('Origin')) fetchHeaders['Origin'] = getStored('Origin');
        }

        console.log('Fetching source URL:', targetUrl);

        // 4. SMART PROXY: Instead of 302, we FETCH to bypass complex redirect/header issues
        const response = await fetch(targetUrl, {
            headers: fetchHeaders,
            redirect: 'follow'
        });

        if (!response.ok) {
            console.error('Source fetch failed:', response.status, response.statusText);
            // Fallback to direct 302 if fetch fails
            return redirectWithHeaders(targetUrl, stream.headers);
        }

        const contentType = response.headers.get('content-type') || '';
        const finalUrl = response.url;

        // 5. If it's a Manifest (M3U8), rewrite it to fix relative paths and inject DRM headers
        if (contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl') || targetUrl.includes('.m3u8')) {
            let body = await response.text();

            // Rewrite relative URLs to absolute
            const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);

            if (stream.headers) {
                const storedHeaders = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                const headerParts = [];
                const getStored = (k) => storedHeaders[k] || storedHeaders[k.toLowerCase()];
                const ua = getStored('User-Agent');
                const ref = getStored('Referer') || getStored('Origin');
                if (ua) headerParts.push(`User-Agent=${ua}`);
                if (ref) headerParts.push(`Referer=${ref}`);

                if (headerParts.length > 0) {
                    const pipeStr = `|${headerParts.join('&')}`;

                    // Replace URI="license_url" with URI="license_url|Headers"
                    body = body.replace(/(URI=")([^"]+)/g, (match, p1, p2) => {
                        if (p2.includes('license') || p2.includes('key') || p2.includes('wv') || p2.includes('widevine') || p2.includes('clearkey')) {
                            const fullP2 = p2.startsWith('http') ? p2 : new URL(p2, baseUrl).toString();
                            return `${p1}${fullP2}${pipeStr}`;
                        }
                        return match;
                    });

                    // Fix relative segments
                    body = body.split('\n').map(line => {
                        const t = line.trim();
                        if (t && !t.startsWith('#') && !t.startsWith('http')) {
                            try { return new URL(t, baseUrl).toString(); } catch (e) { return line; }
                        }
                        return line;
                    }).join('\n');
                }
            }

            return new NextResponse(body, {
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 6. Default: Redirect to final URL
        return redirectWithHeaders(finalUrl, stream.headers);

    } catch (error) {
        console.error('Smart Proxy Error:', error);
        return new NextResponse(`Server error: ${error.message}`, { status: 500 });
    }
}

function redirectWithHeaders(url, headersJson) {
    let finalUrl = url.trim();
    if (finalUrl.endsWith('&') || finalUrl.endsWith('?')) finalUrl = finalUrl.slice(0, -1);

    if (headersJson) {
        const headers = typeof headersJson === 'string' ? JSON.parse(headersJson) : headersJson;
        const headerParts = [];
        const getHeader = (k) => headers[k] || headers[k.toLowerCase()];
        const ua = getHeader('User-Agent');
        if (ua) headerParts.push(`User-Agent=${ua}`);
        const ref = getHeader('Referer') || getHeader('Origin');
        if (ref) headerParts.push(`Referer=${ref}`);
        if (headerParts.length > 0) finalUrl += `|${headerParts.join('&')}`;
    }

    return new NextResponse(null, {
        status: 302,
        headers: { 'Location': finalUrl, 'Cache-Control': 'no-cache' }
    });
}
