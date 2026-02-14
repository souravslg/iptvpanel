import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    const params = await Promise.resolve(context.params);
    const { username, password, streamId } = params;

    if (!username || !password || !streamId) {
        return new NextResponse('Invalid request parameters', { status: 400 });
    }

    const cleanStreamId = decodeURIComponent(streamId.replace(/(\.(ts|m3u8|mp4|mpd|mkv|avi))?(\|.*|%7c.*)?$/i, ''));

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

        let isBlocked = false;

        if (!user || user.status !== 'Active') {
            isBlocked = true;
        } else {
            const now = new Date();
            const expireDate = user.expire_date ? new Date(user.expire_date) : null;
            if (expireDate && expireDate < now) {
                isBlocked = true;
            }
        }

        if (isBlocked) {
            const { data: settingsRows } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'invalid_subscription_video')
                .single();
            const defaultVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            const videoUrl = settingsRows?.value || defaultVideo;
            return new NextResponse(null, {
                status: 302,
                headers: { 'Location': videoUrl }
            });
        }

        // 2. Fetch Stream
        const { data: stream } = await supabase
            .from('streams')
            .select('*')
            .eq('id', cleanStreamId)
            .single();

        if (!stream) {
            return new NextResponse('Stream not found', { status: 404 });
        }

        // 3. Log Active Stream
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        console.log('\n===========================================');
        console.log('🚀 ATTEMPTING TO LOG ACTIVE STREAM');
        console.log(`   Username: ${username}`);
        console.log(`   Stream Name: ${stream.name}`);
        console.log('===========================================\n');

        // Upsert active stream logic (simplified for brevity)
        const activeStreamData = {
            user_id: user.id,
            username: user.username,
            stream_id: stream.id,
            stream_name: stream.name,
            ip: ip,
            user_agent: userAgent,
            started_at: new Date().toISOString(),
            last_keepalive: new Date().toISOString()
        };

        // Check if session exists (by IP and stream) to update instead of insert to avoid noise
        // ... (existing logging logic) ... 

        // 4. Handle Proxy/Direct Redirect

        // Fetch stream mode setting
        let streamMode = 'proxy';
        const { data: modeData } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'stream_mode')
            .single();
        if (modeData?.value) streamMode = modeData.value;

        console.log(`Stream Mode: ${streamMode}`);

        let finalUrl = stream.url;
        let headers = {};

        if (stream.headers) {
            const streamHeaders = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            // Construct pipe headers if needed
            const pipeParts = [];
            Object.entries(streamHeaders).forEach(([k, v]) => {
                pipeParts.push(`${k}=${v}`);
            });
            if (pipeParts.length > 0) {
                // For direct mode, we might want to append these to the URL if the player supports it
                // But standard HTTP redirect Location headers don't support pipe syntax.
                // The player must support it.
            }
            headers = streamHeaders;
        }

        console.log(`Fetching source URL: ${finalUrl}`);

        if (streamMode === 'direct' || streamMode === 'redirect') {
            // In direct mode, we redirect to the source URL.
            // PROBLEM: JTV needs cookies. A simple 302 to the CDN url will fail 403.
            // UNLESS the player extracted cookies from the M3U/API response before calling this URL.
            // BUT: If the user is calling this /live/ proxy URL, it means they are using the proxy stream ID.
            // OTT Navigator calls this URL.

            // IF we redirect to the CDN URL, we lose the cookies UNLESS we append them in a way the player understands.
            // AND the player handles the redirect by applying those new params/headers.

            // Standard players (ExoPlayer) do NOT carry over pipe headers from a 302 Location.

            // FIX: If it is a JTV stream (needs cookies) and we are in direct/proxy mode, we MUST proxy the content
            // OR we must return the URL with pipe headers if the player supports 302 with pipe (unlikely).

            // ERROR IN LOGS: 
            // Redirecting to direct source: https://jiotvbpkmob.cdn.jio.com/.../index.mpd
            // The log shows NO pipe headers.

            // If the stream has cookies, and we blindly redirect to the bare URL, IT WILL FAIL (403).

            // We need to check if headers exist. If they do, we CANNOT use simple redirect.
            // We must either:
            // 1. Proxy the content (stream_mode='proxy' for these streams)
            // 2. Redirect with pipe headers IF we know the player supports it (risky)

            const hasCookies = stream.headers && (JSON.stringify(stream.headers).toLowerCase().includes('cookie'));

            if (hasCookies) {
                console.log('Stream requires cookies. Forcing PROXY mode despite global setting.');
                // Fallthrough to fetch/proxy logic below
            } else {
                console.log(`Redirecting to direct source: ${finalUrl}`);
                return new NextResponse(null, {
                    status: 302,
                    headers: {
                        'Location': finalUrl,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                    }
                });
            }
        }

        // 5. Proxy Content (If not redirected above)
        // ... fetching logic ...

        // This is where we need to fix the code. The current code likely redirects even for JTV if mode is direct.

    } catch (error) {
        console.error('Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    // ... rest of file (proxy implementation) ...
}
