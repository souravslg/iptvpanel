import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Serve M3U playlist for user
export async function GET(request, context) {
    try {
        const params = await Promise.resolve(context.params);
        const { username, token } = params;

        console.log('[USER PLAYLIST] Request for:', username);

        // 1. Validate user and token
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('playlist_token', token)
            .single();

        if (userError || !user) {
            console.log('[USER PLAYLIST] Invalid username or token');
            return new NextResponse('Invalid playlist URL', { status: 404 });
        }

        // 2. Check user status
        if (user.status !== 'Active') {
            console.log('[USER PLAYLIST] User is not active');
            return new NextResponse('Account is not active', { status: 403 });
        }

        // 3. Check expiry
        if (user.expire_date) {
            const expiryDate = new Date(user.expire_date);
            const now = new Date();
            if (now > expiryDate) {
                console.log('[USER PLAYLIST] User expired');
                return new NextResponse('Account has expired', { status: 410 });
            }
        }

        // 4. Get client info
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const ua = request.headers.get('user-agent') || 'unknown';

        // 5. Check device limits (if set)
        if (user.device_limit !== null && user.device_limit > 0) {
            // Update or create device record
            await supabaseAdmin
                .from('user_devices')
                .upsert({
                    user_id: user.id,
                    device_ip: ip,
                    device_ua: ua,
                    device_name: `Device ${ip.substring(0, 10)}`,
                    last_seen: new Date().toISOString(),
                    is_active: true
                }, {
                    onConflict: 'user_id,device_ip'
                });

            // Count active devices (seen in last 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: activeDevices } = await supabaseAdmin
                .from('user_devices')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .gte('last_seen', fiveMinutesAgo);

            if (activeDevices && activeDevices.length > user.device_limit) {
                console.log(`[USER PLAYLIST] Device limit exceeded: ${activeDevices.length}/${user.device_limit}`);
                return new NextResponse('Device limit exceeded', { status: 403 });
            }
        }

        // 6. Get user's allowed streams
        // If user has specific permissions, use those; otherwise use all active streams
        const { data: permissions } = await supabase
            .from('user_channel_permissions')
            .select('stream_id, allowed')
            .eq('user_id', user.id);

        let streams;

        if (permissions && permissions.length > 0) {
            // User has specific channel permissions
            const allowedStreamIds = permissions
                .filter(p => p.allowed)
                .map(p => p.stream_id);

            if (allowedStreamIds.length === 0) {
                // User has permissions but none are allowed
                streams = [];
            } else {
                const { data } = await supabase
                    .from('streams')
                    .select('*')
                    .in('id', allowedStreamIds);
                streams = data || [];
            }
        } else {
            // No specific permissions - give access to all active streams
            const { data: activePlaylists } = await supabase
                .from('playlists')
                .select('id')
                .eq('is_active', true);

            if (activePlaylists && activePlaylists.length > 0) {
                const playlistIds = activePlaylists.map(p => p.id);
                const { data } = await supabase
                    .from('streams')
                    .select('*')
                    .in('playlist_id', playlistIds);
                streams = data || [];
            } else {
                streams = [];
            }
        }

        // 7. Generate M3U content
        let m3uContent = '#EXTM3U\n';
        m3uContent += `#EXTINF:-1,Playlist for ${user.username}\n`;

        const baseUrl = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;

        for (const stream of streams) {
            const tvgId = stream.tvg_id || '';
            const tvgName = stream.tvg_name || stream.name;
            const tvgLogo = stream.tvg_logo || stream.logo || '';
            const groupTitle = stream.group_title || stream.category || 'General';

            m3uContent += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${stream.name}\n`;
            m3uContent += `${baseUrl}/live/${user.username}/${user.password}/${stream.stream_id || stream.id}\n`;
        }

        // 8. Update access statistics
        await supabaseAdmin
            .from('users')
            .update({
                playlist_last_accessed: new Date().toISOString(),
                playlist_access_count: (user.playlist_access_count || 0) + 1
            })
            .eq('id', user.id);

        // 9. Log access
        await supabaseAdmin
            .from('playlist_access_logs')
            .insert({
                user_id: user.id,
                ip_address: ip,
                user_agent: ua,
                stream_count: streams.length,
                device_info: `${ip} - ${ua.substring(0, 100)}`
            });

        console.log(`[USER PLAYLIST] Served ${streams.length} channels to ${username}`);

        // 10. Return M3U content
        return new NextResponse(m3uContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Content-Disposition': `attachment; filename="${username}-playlist.m3u"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('[USER PLAYLIST] Failed to serve playlist:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
