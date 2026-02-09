import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TataPlay } from '@/lib/tataplay';
import { SonyLiv } from '@/lib/sonyliv';

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
            return new NextResponse('No active playlists found in DB', { status: 404 });
        }

        const playlistIds = activePlaylists.map(p => p.id);
        const isNumeric = /^\d+$/.test(cleanStreamId);
        let query = supabase.from('streams').select('*').in('playlist_id', playlistIds);

        if (isNumeric) {
            query = query.or(`id.eq.${cleanStreamId},stream_id.eq.${cleanStreamId}`);
        } else {
            query = query.eq('stream_id', cleanStreamId);
        }

        const { data: streams, error: streamError } = await query;
        if (streamError) {
            return new NextResponse(`DB Error: ${streamError.message}`, { status: 500 });
        }
        if (!streams || streams.length === 0) {
            return new NextResponse(`Stream ${cleanStreamId} not found in active playlists [${playlistIds.join(',')}]`, { status: 404 });
        }

        const stream = streams[0];
        let targetUrl = stream.url;
        let licenseUrl = null;

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

        // -------------------------------------------------------------
        // SOURCE-SPECIFIC HANDLING (Tata Play, SonyLiv, etc.)
        // -------------------------------------------------------------
        if (cleanStreamId.startsWith('tataplay-')) {
            const channelId = cleanStreamId.replace('tataplay-', '');
            const tpData = await TataPlay.getStreamUrl(channelId);
            if (tpData) {
                targetUrl = tpData.url;
                licenseUrl = tpData.licenseUrl;
                if (tpData.headers) Object.assign(fetchHeaders, tpData.headers);
            }
        }

        if (cleanStreamId.startsWith('sonyliv-')) {
            const channelId = cleanStreamId.replace('sonyliv-', '');
            const slData = await SonyLiv.getStreamUrl(channelId);
            if (slData) {
                targetUrl = slData.url;
                licenseUrl = slData.licenseUrl;
                if (slData.headers) Object.assign(fetchHeaders, slData.headers);
            }
        }
        // -------------------------------------------------------------

        if (!targetUrl) return new NextResponse('Missing target URL', { status: 500 });


        // --- Active Stream Logging ---
        try {
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const ua = request.headers.get('user-agent') || 'unknown';

            // Updates or Inserts active stream record
            // We use (username, stream_id) as unique key for simplicity if IP matches, 
            // or we just upsert based on a composite key if the table supports it.
            // Assuming active_streams has a unique constraint on (username, stream_id) or we just insert.
            // To be safe and avoid "duplicate key" limit, let's try to update first, then insert.

            const streamData = {
                username,
                stream_id: stream.stream_id || stream.id,
                stream_name: stream.name,
                server_id: 1, // Default
                ip_address: ip,
                user_agent: ua,
                last_ping: new Date().toISOString()
            };

            // Use supabaseAdmin to bypass RLS
            const { supabaseAdmin } = await import('@/lib/supabase-admin');

            // Try to update existing session for this user/stream
            const { data: existing } = await supabaseAdmin
                .from('active_streams')
                .select('id')
                .eq('username', username)
                .eq('stream_id', streamData.stream_id)
                .single();

            if (existing) {
                await supabaseAdmin
                    .from('active_streams')
                    .update({ last_ping: new Date().toISOString(), ip_address: ip })
                    .eq('id', existing.id);
            } else {
                await supabaseAdmin
                    .from('active_streams')
                    .insert({
                        ...streamData,
                        started_at: new Date().toISOString()
                    });
            }
        } catch (logErr) {
            console.error('Logging error:', logErr);
            // Non-blocking
        }
        // -----------------------------


        console.log('Fetching source URL:', targetUrl);

        // 4. SMART PROXY: Instead of 302, we FETCH to bypass complex redirect/header issues
        const response = await fetch(targetUrl, {
            headers: fetchHeaders,
            redirect: 'follow'
        });

        if (!response.ok) {
            console.error('Source fetch failed:', response.status, response.statusText);
            return redirectWithHeaders(targetUrl, stream.headers);
        }

        const contentType = response.headers.get('content-type') || '';
        const finalUrl = response.url;

        // 5. If it's a Manifest (M3U8), rewrite it to fix relative paths and inject DRM headers
        if (contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl') || targetUrl.includes('.m3u8')) {
            let body = await response.text();

            // 1. Inject License Info if present (Widevine Support)
            if (licenseUrl) {
                body = body.replace('#EXTM3U', `#EXTM3U\n#KODIPROP:inputstream.adaptive.license_type=widevine\n#KODIPROP:inputstream.adaptive.license_key=${licenseUrl}`);
            }

            // 2. Rewrite relative URLs to absolute
            const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);

            // Standard cleanup before header injection
            body = body.split('\n').map(line => {
                const t = line.trim();
                if (t && !t.startsWith('#') && !t.startsWith('http')) {
                    try { return new URL(t, baseUrl).toString(); } catch (e) { return line; }
                }
                return line;
            }).join('\n');

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

                    body = body.replace(/(URI=")([^"]+)/g, (match, p1, p2) => {
                        if (p2.includes('license') || p2.includes('key') || p2.includes('wv') || p2.includes('widevine') || p2.includes('clearkey')) {
                            const fullP2 = p2.startsWith('http') ? p2 : new URL(p2, baseUrl).toString();
                            return `${p1}${fullP2}${pipeStr}`;
                        }
                        return match;
                    });
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
