import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, context) {
    // In Next.js 16, params might be async
    const params = await Promise.resolve(context.params);
    const { username, password, streamId } = params;

    // Validate params exist
    if (!username || !password || !streamId) {
        console.error('Missing params:', { username, password, streamId });
        return new NextResponse('Invalid request parameters', { status: 400 });
    }

    // Clean any pipe headers from the input ID (e.g. |User-Agent=...)
    // Also remove extensions
    const cleanStreamId = decodeURIComponent(streamId.replace(/(\.(ts|m3u8|mp4))?(\|.*)?$/, ''));

    try {
        console.log('Live stream request:', { username, password, streamId, cleanStreamId });

        // Authenticate user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (userError || !user) {
            console.log('Authentication failed');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check if user is active
        const now = new Date();
        const expireDate = user.expire_date ? new Date(user.expire_date) : null;

        // Compare dates at midnight to avoid timezone issues
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expireDateOnly = expireDate ? new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate()) : null;

        const isExpired = expireDateOnly && expireDateOnly < nowDate;
        const isActive = user.status === 'Active' && !isExpired;

        console.log('User check (DETAILED):', {
            username: user.username,
            status: user.status,
            expireDate: user.expire_date,
            expireDateParsed: expireDate?.toISOString(),
            nowDate: nowDate.toISOString(),
            expireDateOnly: expireDateOnly?.toISOString(),
            isExpired,
            isActive,
            comparison: expireDateOnly && nowDate ? `${expireDateOnly.toISOString().split('T')[0]} < ${nowDate.toISOString().split('T')[0]} = ${isExpired}` : 'N/A'
        });

        if (!isActive) {
            // Fetch invalid subscription video URL from settings
            let invalidSubVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

            try {
                const { data: settingRow, error: settingsError } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'invalid_subscription_video')
                    .single();

                if (settingsError) {
                    console.warn('Settings table error (using default video):', settingsError.message);
                } else if (settingRow?.value) {
                    invalidSubVideo = settingRow.value;
                }
            } catch (error) {
                console.warn('Failed to fetch settings (using default video):', error.message);
            }

            console.log('User inactive/expired, redirecting to:', invalidSubVideo);
            return NextResponse.redirect(invalidSubVideo);
        }

        // Get active playlists first
        const { data: activePlaylists, error: playlistError } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true);

        if (playlistError || !activePlaylists || activePlaylists.length === 0) {
            console.log('No active playlists found');
            return new NextResponse('No active playlists', { status: 404 });
        }

        const playlistIds = activePlaylists.map(p => p.id);
        console.log('Searching in active playlists:', playlistIds);

        // Build query efficiently
        let query = supabase
            .from('streams')
            .select('*')
            .in('playlist_id', playlistIds);

        // Handle numeric vs string IDs to avoid "invalid input syntax for integer"
        const isNumeric = /^\d+$/.test(cleanStreamId);

        if (isNumeric) {
            query = query.or(`id.eq.${cleanStreamId},stream_id.eq.${cleanStreamId}`);
        } else {
            query = query.eq('stream_id', cleanStreamId);
        }

        const { data: streams, error: streamError } = await query;

        if (streamError || !streams || streams.length === 0) {
            console.log('Stream not found in active playlists:', cleanStreamId);
            return new NextResponse(`Stream not found: ${cleanStreamId}`, { status: 404 });
        }

        // If multiple streams found (from different playlists), use the first one
        const stream = streams[0];
        console.log(`Found ${streams.length} stream(s), using:`, stream.name, 'from playlist', stream.playlist_id);

        console.log('Redirecting to stream URL:', stream.url);

        // Validate stream URL before redirecting
        if (!stream.url || stream.url.trim() === '') {
            console.error('Stream URL is empty for stream:', cleanStreamId);
            return new NextResponse('Stream URL not configured', { status: 500 });
        }

        // Track active stream (one stream per user - replace old streams)
        try {
            console.log('📊 Attempting to track stream:', { username, streamId: cleanStreamId });

            const userAgent = request.headers.get('user-agent') || 'Unknown';
            const ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'Unknown';

            console.log('📍 Client info:', { userAgent, ipAddress });

            // Check if this user-stream combination already exists
            const { data: existingStream, error: checkError } = await supabase
                .from('active_streams')
                .select('id')
                .eq('username', username)
                .eq('stream_id', cleanStreamId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.warn('⚠️  Error checking existing stream:', checkError);
            }

            if (existingStream) {
                // Update last_ping for existing stream (same channel)
                console.log('🔄 Updating existing stream record:', existingStream.id);
                const { error: updateError } = await supabase
                    .from('active_streams')
                    .update({
                        last_ping: new Date().toISOString(),
                        ip_address: ipAddress
                    })
                    .eq('id', existingStream.id);

                if (updateError) {
                    console.error('❌ Failed to update stream:', updateError);
                } else {
                    console.log('✅ Stream updated successfully');
                }
            } else {
                // User is switching to a different channel
                // Delete ALL existing streams for this user first
                console.log('🗑️  Deleting old streams for user:', username);
                const { error: deleteError } = await supabase
                    .from('active_streams')
                    .delete()
                    .eq('username', username);

                if (deleteError) {
                    console.warn('⚠️  Error deleting old streams:', deleteError);
                }

                // Insert new active stream record
                console.log('➕ Inserting new stream record');
                const { data: insertData, error: insertError } = await supabase
                    .from('active_streams')
                    .insert({
                        user_id: user.id,
                        username: username,
                        stream_id: cleanStreamId,
                        stream_name: stream.name,
                        user_agent: userAgent,
                        ip_address: ipAddress,
                        started_at: new Date().toISOString(),
                        last_ping: new Date().toISOString()
                    })
                    .select();

                if (insertError) {
                    console.error('❌ Failed to insert stream:', insertError);
                } else {
                    console.log('✅ Stream inserted successfully:', insertData);
                }
            }

            // Clean up old inactive streams (older than 10 minutes)
            const { error: cleanupError } = await supabase
                .from('active_streams')
                .delete()
                .lt('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString());

            if (cleanupError) {
                console.warn('⚠️  Cleanup error:', cleanupError);
            } else {
                console.log('🧹 Cleanup completed');
            }

        } catch (trackError) {
            // Don't fail the stream if tracking fails
            console.error('❌ TRACKING ERROR:', trackError);
            console.error('Error details:', {
                message: trackError.message,
                stack: trackError.stack
            });
        }

        // Construct Final URL with Headers for Player Compatibility
        // Many players (OTT Navigator, Tivimate) support appending headers via pipe (|)
        // If we extracted headers during import, we should append them back here
        // so the player knows what headers to use for the redirect.

        let finalUrl = stream.url;

        if (stream.headers) {
            const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            const headerParts = [];

            if (headers['User-Agent'] || headers['user-agent']) {
                headerParts.push(`User-Agent=${headers['User-Agent'] || headers['user-agent']}`);
            }
            if (headers['Referer'] || headers['referer']) {
                headerParts.push(`Referer=${headers['Referer'] || headers['referer']}`);
            }

            // Append other headers if needed, but UA/Referer are most critical

            if (headerParts.length > 0) {
                finalUrl += `|${headerParts.join('&')}`;
            }
        }

        // Redirect to the actual stream URL with headers appended
        return NextResponse.redirect(finalUrl);
    } catch (error) {
        console.error('Stream proxy error:', {
            message: error.message,
            stack: error.stack,
            username,
            streamId: cleanStreamId
        });
        return new NextResponse(`Server error: ${error.message}`, { status: 500 });
    }
}
