
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TataPlay } from '@/lib/tataplay';
import { SonyLiv } from '@/lib/sonyliv';

export const dynamic = 'force-dynamic'; // Prevent Vercel caching

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

        // 2. Check User Status & Expiry
        let isBlocked = false;

        if (!user || user.status !== 'Active') {
            console.log('User inactive:', username);
            isBlocked = true;
        } else {
            const now = new Date();
            const expireDate = user.expire_date ? new Date(user.expire_date) : null;
            if (expireDate && expireDate < now) {
                console.log('User expired:', username);
                isBlocked = true;
            }
        }

        if (isBlocked) {
            // Fetch invalid subscription video URL from settings
            const { data: settingsRows } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'invalid_subscription_video')
                .single();

            // Default video if not set
            const defaultVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            const videoUrl = settingsRows?.value || defaultVideo;

            console.log('Redirecting blocked user to:', videoUrl);
            return new NextResponse(null, {
                status: 302,
                headers: {
                    'Location': videoUrl,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
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
        // Clean URL to remove newlines/spaces that might have been pasted in
        let targetUrl = stream.url ? stream.url.replace(/\s/g, '').trim() : '';
        // let licenseUrl = null; // Unused in redirect mode

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
            if (getStored('Cookie')) fetchHeaders['Cookie'] = getStored('Cookie');
        }

        // -------------------------------------------------------------
        // SOURCE-SPECIFIC HANDLING (Tata Play, SonyLiv, etc.)
        // -------------------------------------------------------------
        if (cleanStreamId.startsWith('tataplay-')) {
            const channelId = cleanStreamId.replace('tataplay-', '');
            const tpData = await TataPlay.getStreamUrl(channelId);
            if (tpData) {
                targetUrl = tpData.url;
                // licenseUrl = tpData.licenseUrl;
                if (tpData.headers) Object.assign(fetchHeaders, tpData.headers);
            }
        }

        if (cleanStreamId.startsWith('sonyliv-')) {
            const channelId = cleanStreamId.replace('sonyliv-', '');
            const slData = await SonyLiv.getStreamUrl(channelId);
            if (slData) {
                targetUrl = slData.url;
                // licenseUrl = slData.licenseUrl;
                if (slData.headers) Object.assign(fetchHeaders, slData.headers);
            }
        }
        // -------------------------------------------------------------

        if (!targetUrl) return new NextResponse('Missing target URL', { status: 500 });


        // --- Active Stream Logging ---
        console.log('\n===========================================');
        console.log('🚀 ATTEMPTING TO LOG ACTIVE STREAM');
        console.log('   Username:', username);
        console.log('   Stream Name:', stream.name);
        console.log('===========================================\n');

        try {
            console.log('🔵 Active Stream Logging: START');
            const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
            const ua = request.headers.get('user-agent') || 'unknown';

            const streamData = {
                username,
                stream_id: stream.stream_id || stream.id?.toString() || cleanStreamId,
                stream_name: stream.name || 'Unknown Channel',
                ip_address: ip,
                user_agent: ua,
                last_ping: new Date().toISOString()
            };

            console.log('📊 Stream Data to Log:', {
                username: streamData.username,
                stream_id: streamData.stream_id,
                stream_name: streamData.stream_name,
                ip: streamData.ip_address
            });

            // Try to update existing session for this user/stream
            const { data: existing, error: selectError } = await supabaseAdmin
                .from('active_streams')
                .select('id')
                .eq('username', username)
                .eq('stream_id', streamData.stream_id)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                console.error('❌ Error checking existing stream:', selectError);
            }

            if (existing) {
                console.log('🔄 Updating existing stream session:', existing.id);
                const { error: updateError } = await supabaseAdmin
                    .from('active_streams')
                    .update({
                        last_ping: new Date().toISOString(),
                        ip_address: ip,
                        stream_name: streamData.stream_name  // Update name too
                    })
                    .eq('id', existing.id);

                if (updateError) {
                    console.error('❌ Update error:', updateError);
                } else {
                    console.log('✅ Stream session updated successfully');
                }
            } else {
                // User is starting a NEW stream - end all their other active streams first
                console.log('🧹 Cleaning up other active streams for this user...');
                const { error: deleteError } = await supabaseAdmin
                    .from('active_streams')
                    .delete()
                    .eq('username', username);

                if (deleteError) {
                    console.error('⚠️ Error cleaning up old streams:', deleteError);
                } else {
                    console.log('✅ Old streams cleaned up');
                }

                console.log('➕ Inserting new stream session');
                const { error: insertError } = await supabaseAdmin
                    .from('active_streams')
                    .insert({
                        ...streamData,
                        started_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.error('❌ Insert error:', insertError);
                } else {
                    console.log('✅ New stream session logged successfully');
                }
            }
        } catch (logErr) {
            console.error('❌ Active Stream Logging FAILED:', logErr);
            console.error('Error details:', {
                message: logErr.message,
                code: logErr.code,
                details: logErr.details,
                hint: logErr.hint
            });
            // Non-blocking - continue with stream delivery
        }
        // -----------------------------



        // --- Stream Mode Check ---
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
        console.log('Stream Mode:', streamMode);

        console.log('Fetching source URL:', targetUrl);

        // If Direct/Redirect mode, we redirect user to source
        // This handles cases where players construct the /live/ URL manually
        if (streamMode === 'direct' || streamMode === 'redirect') {
            console.log('Redirecting to direct source:', targetUrl);
            // We still logged the active stream above, which is good.
            return NextResponse.redirect(targetUrl, { status: 302 }); // 302 is better for player compatibility than 307
        }

        // 4. PROXY MODE: Fetch and stream back to client
        // This hides the source URL and handles headers server-side.
        // It consumes server bandwidth but ensures compatibility (headers don't break players)
        // and enforces strict access control (user stays connected to proxy).

        console.log('Proxying stream from:', targetUrl);

        try {
            const response = await fetch(targetUrl, {
                headers: fetchHeaders,
                method: 'GET'
            });

            if (!response.ok) {
                console.error(`Upstream error: ${response.status} ${response.statusText}`);
                return new NextResponse(`Upstream Error: ${response.status}`, { status: response.status });
            }

            // Forward relevant headers
            const responseHeaders = new Headers(response.headers);
            // Ensure we don't cache locally if we want real-time control (already handled by route headers, but be safe)
            responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            responseHeaders.set('Pragma', 'no-cache');
            responseHeaders.set('Expires', '0');

            // Allow CORS
            responseHeaders.set('Access-Control-Allow-Origin', '*');

            return new NextResponse(response.body, {
                status: response.status,
                headers: responseHeaders
            });

        } catch (fetchErr) {
            console.error('Proxy fetch failed:', fetchErr);
            return new NextResponse(`Proxy Error: ${fetchErr.message}`, { status: 502 });
        }
    } catch (error) {
        console.error('Smart Proxy Error:', error);
        return new NextResponse(`Server error: ${error.message}`, { status: 500 });
    }
}

