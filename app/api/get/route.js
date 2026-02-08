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
                m3u += `#KODIPROP:inputstream.adaptive.license_key={"keys":[{"kty":"oct","k":"${stream.drm_key}","kid":"${stream.drm_key_id}"}],"type":"temporary"}\n`;
            } else if (stream.drm_scheme === 'widevine' && stream.drm_license_url) {
                m3u += `#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha\n`;
                m3u += `#KODIPROP:inputstream.adaptive.license_key=${stream.drm_license_url}\n`;
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
