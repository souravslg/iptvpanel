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

        // Helper to get consistent category mapping
        // Added typeFilter to support VOD/Series categories
        const getCategoryMapping = async (activePlaylistIds, typeFilter = 'live') => {
            let allCategories = new Set();
            let hasMore = true;
            let offset = 0;
            const batchSize = 1000;

            while (hasMore) {
                let query = supabase
                    .from('streams')
                    .select('category')
                    .in('playlist_id', activePlaylistIds);

                if (typeFilter) {
                    query = query.eq('type', typeFilter);
                }

                const { data: batch, error } = await query.range(offset, offset + batchSize - 1);

                if (error || !batch || batch.length === 0) {
                    hasMore = false;
                } else {
                    batch.forEach(s => {
                        if (s.category) allCategories.add(s.category);
                    });
                    offset += batchSize;
                    hasMore = batch.length === batchSize;
                }
            }

            // sort categories to ensure consistent ID assignment (alphabetical)
            const sortedCategories = Array.from(allCategories).sort();
            const categoryMap = {};
            sortedCategories.forEach((cat, index) => {
                categoryMap[cat] = (index + 1).toString(); // Xstream category IDs usually strings of numbers
            });

            return { categoryMap, sortedCategories };
        };

        // Handle different actions
        if (action === 'get_live_streams' || action === 'get_vod_streams' || action === 'get_series') {
            if (!isActive) {
                // Return empty/system stream message only for live
                if (action === 'get_live_streams') {
                    return NextResponse.json([{
                        num: 1,
                        name: 'Account Expired/Inactive',
                        stream_type: 'live',
                        stream_id: 1,
                        stream_icon: '',
                        category_id: '1', // System
                        added: Math.floor(Date.now() / 1000).toString(),
                        custom_sid: '',
                        tv_archive: 0,
                        direct_source: invalidVideoUrl,
                        tv_archive_duration: 0,
                        container_extension: 'mp4'
                    }]);
                }
                return NextResponse.json([]);
            }

            // Get active playlists
            const { data: activePlaylists, error: playlistError } = await supabase
                .from('playlists')
                .select('id')
                .eq('is_active', true);

            if (playlistError || !activePlaylists || activePlaylists.length === 0) {
                return NextResponse.json([]);
            }

            const playlistIds = activePlaylists.map(p => p.id);

            // Determine type based on action
            let targetType = 'live';
            if (action === 'get_vod_streams') targetType = 'movie'; // Assuming 'movie' for VOD
            if (action === 'get_series') targetType = 'series';

            // Get category mapping for this type
            const { categoryMap } = await getCategoryMapping(playlistIds, targetType);

            // Get all streams
            let allStreams = [];
            let hasMore = true;
            let offset = 0;
            const batchSize = 1000;

            while (hasMore) {
                let query = supabase
                    .from('streams')
                    .select('*')
                    .in('playlist_id', playlistIds)
                    .eq('type', targetType) // Strict Type Filtering
                    .order('id', { ascending: true })
                    .range(offset, offset + batchSize - 1);

                const { data: batch, error: batchError } = await query;

                if (batchError) break;

                if (batch && batch.length > 0) {
                    allStreams = allStreams.concat(batch);
                    offset += batchSize;
                    hasMore = batch.length === batchSize;
                } else {
                    hasMore = false;
                }
            }

            // Get server URL
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('host') || 'localhost:3000';

            const formattedStreams = allStreams.map(stream => {
                const streamId = stream.stream_id || stream.id;

                // URL Construction
                let streamUrl = stream.url;
                let licenseUrl = stream.drm_license_url;

                if (stream.headers) {
                    const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
                    const headerParts = [];
                    const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

                    const ua = getHeader('User-Agent');
                    if (ua) headerParts.push(`User-Agent=${ua}`);

                    const ref = getHeader('Referer') || getHeader('Origin');
                    if (ref) headerParts.push(`Referer=${ref}`);

                    if (headerParts.length > 0) {
                        const pipeHeaders = headerParts.join('&');
                        if (streamUrl) streamUrl += `|${pipeHeaders}`;
                        if (licenseUrl) licenseUrl += `|${pipeHeaders}`;
                    }
                }




                // Determine extension based on actual stream format
                let extension = 'ts';
                if (targetType === 'movie') {
                    extension = 'mp4';
                } else if (stream.url) {
                    // Detect format from source URL
                    if (stream.url.includes('.m3u8') || stream.url.includes('/hls/')) {
                        extension = 'm3u8';
                    } else if (stream.url.includes('.mpd') || stream.url.includes('/dash/')) {
                        extension = 'mpd';
                    }
                    // else defaults to 'ts'
                }

                // Use PROXY URL instead of raw stream URL for direct_source
                let proxyUrl = `${protocol}://${host}/live/${username}/${password}/${streamId}.${extension}`;


                // Map category name to ID
                const catId = categoryMap[stream.category] || '0'; // 0 or Uncategorized

                const streamData = {
                    num: stream.id,
                    name: stream.name,
                    title: stream.name, // Many players verify 'title'
                    stream_type: stream.type || 'live',
                    stream_id: streamId, // Use same ID as proxy URL for consistency
                    stream_icon: stream.logo || '',
                    epg_channel_id: null, // Critical for some players
                    added: stream.created_at ? Math.floor(new Date(stream.created_at).getTime() / 1000).toString() : '0',
                    category_id: catId,
                    custom_sid: '',
                    tv_archive: 0,
                    direct_source: proxyUrl,
                    tv_archive_duration: 0,
                    container_extension: extension
                };

                // DRM
                if (stream.drm_scheme) {
                    streamData.drm_scheme = stream.drm_scheme;
                    if (licenseUrl) streamData.drm_license_url = licenseUrl;

                    // For clearkey, convert Hex keys to Base64URL (same as M3U implementation)
                    if (stream.drm_scheme === 'clearkey' && stream.drm_key_id && stream.drm_key) {
                        // Helper to convert Hex to Base64URL
                        const toBase64Url = (hexString) => {
                            try {
                                if (hexString && /^[0-9a-fA-F]+$/.test(hexString) && hexString.length % 2 === 0) {
                                    return Buffer.from(hexString, 'hex').toString('base64url');
                                }
                                return hexString; // Return as-is if not valid Hex
                            } catch (e) {
                                return hexString;
                            }
                        };

                        streamData.drm_key_id = toBase64Url(stream.drm_key_id);
                        streamData.drm_key = toBase64Url(stream.drm_key);
                    } else {
                        // For other DRM schemes (Widevine), return keys as-is
                        if (stream.drm_key_id) streamData.drm_key_id = stream.drm_key_id;
                        if (stream.drm_key) streamData.drm_key = stream.drm_key;
                    }
                }

                return streamData;
            });

            return NextResponse.json(formattedStreams);
        }

        if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
            if (!isActive) {
                // Return empty system category only for live? Or just return valid empty list.
                if (action === 'get_live_categories') {
                    return NextResponse.json([{
                        category_id: '1',
                        category_name: 'System',
                        parent_id: 0
                    }]);
                }
                return NextResponse.json([]);
            }

            // Get active playlists
            const { data: activePlaylists, error: playlistError } = await supabase
                .from('playlists')
                .select('id')
                .eq('is_active', true);

            if (playlistError || !activePlaylists || activePlaylists.length === 0) {
                return NextResponse.json([]);
            }

            const playlistIds = activePlaylists.map(p => p.id);

            // Determine type
            let targetType = 'live';
            if (action === 'get_vod_categories') targetType = 'movie';
            if (action === 'get_series_categories') targetType = 'series';

            // Get consistent mapping
            const { sortedCategories, categoryMap } = await getCategoryMapping(playlistIds, targetType);

            const formattedCategories = sortedCategories.map(cat => ({
                category_id: categoryMap[cat],
                category_name: cat,
                parent_id: 0
            }));

            return NextResponse.json(formattedCategories);
        }

        // Default: return user info
        // Date format: YYYY-MM-DD HH:mm:ss
        const nowFormatted = now.toISOString().replace('T', ' ').split('.')[0];

        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const port = host.includes(':') ? host.split(':')[1] : (protocol === 'https' ? '443' : '80');
        const urlWithoutPort = host.split(':')[0];

        return NextResponse.json({
            user_info: {
                username: user.username,
                password: user.password,
                message: isActive ? 'Welcome' : (isExpired ? 'Account Expired' : 'Account Inactive'),
                auth: 1,
                status: user.status,
                exp_date: expireDate ? Math.floor(expireDate.getTime() / 1000).toString() : null,
                is_trial: '0',
                active_cons: '0',
                created_at: Math.floor(new Date(user.created_at).getTime() / 1000).toString(),
                max_connections: user.max_connections.toString(),
                allowed_output_formats: ['m3u8', 'ts', 'rtmp']
            },
            server_info: {
                url: urlWithoutPort,
                port: port,
                https_port: '443',
                server_protocol: protocol,
                rtmp_port: '1935',
                timezone: 'Asia/Kolkata',
                timestamp_now: Math.floor(Date.now() / 1000),
                time_now: nowFormatted,
                version: '2.9.0', // Report as XUI 2.9.0 (v2 compatible)
                revision: 5,
                xui: true // Signal XUI compatibility
            }
        });
    } catch (error) {
        console.error('Xtream API error:', error);
        return NextResponse.json({
            user_info: { auth: 0, message: 'Server error' }
        }, { status: 500 });
    }
}
