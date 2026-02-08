import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const password = searchParams.get('password');
        const action = searchParams.get('action');

        console.log('Xtream API request:', { username, password, action });

        if (!username || !password) {
            return NextResponse.json({
                user_info: { auth: 0, message: 'Invalid credentials' }
            }, { status: 401 });
        }

        // Authenticate user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !user) {
            console.log('Authentication failed:', error);
            return NextResponse.json({
                user_info: { auth: 0, message: 'Invalid credentials' }
            }, { status: 401 });
        }

        // Check if user is active and not expired
        const now = new Date();
        const expireDate = user.expire_date ? new Date(user.expire_date) : null;
        const isExpired = expireDate && expireDate < now;
        const isActive = user.status === 'Active' && !isExpired;

        if (!isActive) {
            return NextResponse.json({
                user_info: {
                    auth: 0,
                    message: isExpired ? 'Account expired' : 'Account inactive'
                }
            }, { status: 401 });
        }

        // Handle different actions
        if (action === 'get_live_streams' || action === 'get_vod_streams' || action === 'get_series') {
            // Get active playlists first
            const { data: activePlaylists, error: playlistError } = await supabase
                .from('playlists')
                .select('id')
                .eq('is_active', true);

            if (playlistError) {
                console.error('Error fetching active playlists:', playlistError);
                return NextResponse.json([], { status: 200 });
            }

            // If no active playlists, return empty array
            if (!activePlaylists || activePlaylists.length === 0) {
                console.log('No active playlists found');
                return NextResponse.json([]);
            }

            const playlistIds = activePlaylists.map(p => p.id);
            console.log('Fetching streams from active playlists:', playlistIds);

            // Get all streams from active playlists (fetch in batches to handle large datasets)
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

            console.log(`Fetched ${allStreams.length} streams from active playlists`);

            // Get server URL
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('host') || 'localhost:3000';
            const serverUrl = `${protocol}://${host}`;

            const formattedStreams = (allStreams || []).map(stream => {
                const streamId = stream.stream_id || stream.id;

                // Construct stream URL with headers for player compatibility
                let streamUrl = stream.url;
                let licenseUrl = stream.drm_license_url;

                if (stream.headers) {
                    const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                    const headerParts = [];
                    const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

                    const ua = getHeader('User-Agent');
                    if (ua) headerParts.push(`User-Agent=${ua}`);

                    const ref = getHeader('Referer');
                    if (ref) headerParts.push(`Referer=${ref}`);

                    if (headerParts.length > 0) {
                        const pipeHeaders = headerParts.join('&');
                        if (streamUrl) streamUrl += `|${pipeHeaders}`;
                        if (licenseUrl) licenseUrl += `|${pipeHeaders}`;
                    }
                }

                // Convert ClearKey Hex to Base64URL if needed
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

                const streamData = {
                    num: stream.id,
                    name: stream.name,
                    stream_type: stream.type || 'live',
                    stream_id: streamId,
                    stream_icon: stream.logo || '',
                    category_id: stream.category || 'Uncategorized',
                    added: stream.created_at,
                    custom_sid: '',
                    tv_archive: 0,
                    direct_source: streamUrl, // Use URL with headers if available
                    tv_archive_duration: 0,
                    container_extension: 'ts'
                };

                // Add DRM information if available
                if (stream.drm_scheme) {
                    streamData.drm_scheme = stream.drm_scheme;
                    if (licenseUrl) streamData.drm_license_url = licenseUrl;
                    if (stream.drm_key_id) streamData.drm_key_id = toBase64Url(stream.drm_key_id);
                    if (stream.drm_key) streamData.drm_key = toBase64Url(stream.drm_key);
                }

                return streamData;
            });

            return NextResponse.json(formattedStreams);
        }

        if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
            // Get active playlists first
            const { data: activePlaylists, error: playlistError } = await supabase
                .from('playlists')
                .select('id')
                .eq('is_active', true);

            if (playlistError) {
                console.error('Error fetching active playlists:', playlistError);
                return NextResponse.json([], { status: 200 });
            }

            // If no active playlists, return empty array
            if (!activePlaylists || activePlaylists.length === 0) {
                console.log('No active playlists found');
                return NextResponse.json([]);
            }

            const playlistIds = activePlaylists.map(p => p.id);

            // Get categories from active playlists only
            let allStreams = [];
            let hasMore = true;
            let offset = 0;
            const batchSize = 1000;

            while (hasMore) {
                const { data: batch, error: batchError } = await supabase
                    .from('streams')
                    .select('category')
                    .in('playlist_id', playlistIds)
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

            const categories = [...new Set((allStreams || []).map(s => s.category).filter(Boolean))];
            const formattedCategories = categories.map((cat, idx) => ({
                category_id: idx + 1,
                category_name: cat,
                parent_id: 0
            }));

            return NextResponse.json(formattedCategories);
        }

        // Default: return user info
        return NextResponse.json({
            user_info: {
                username: user.username,
                password: user.password,
                message: 'Welcome',
                auth: 1,
                status: user.status,
                exp_date: expireDate ? Math.floor(expireDate.getTime() / 1000).toString() : null,
                is_trial: '0',
                active_cons: '0',
                created_at: user.created_at,
                max_connections: user.max_connections.toString(),
                allowed_output_formats: ['m3u8', 'ts', 'rtmp']
            },
            server_info: {
                url: request.headers.get('host') || 'localhost:3000',
                port: '80',
                https_port: '443',
                server_protocol: 'http',
                rtmp_port: '1935',
                timezone: 'Asia/Kolkata',
                timestamp_now: Math.floor(Date.now() / 1000),
                time_now: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Xtream API error:', error);
        return NextResponse.json({
            user_info: { auth: 0, message: 'Server error' }
        }, { status: 500 });
    }
}
