import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
    const { username, password, streamId } = params;
    const cleanStreamId = streamId.replace(/\.(ts|m3u8|mp4)$/, '');

    try {
        console.log('Live stream request:', { username, password, streamId });

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
        const isExpired = expireDate && expireDate < now;
        const isActive = user.status === 'Active' && !isExpired;

        console.log('User check:', {
            username: user.username,
            status: user.status,
            expireDate: user.expire_date,
            isExpired,
            isActive,
            now: now.toISOString()
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

        // Get stream by ID or stream_id
        const { data: stream, error: streamError } = await supabase
            .from('streams')
            .select('*')
            .or(`id.eq.${cleanStreamId},stream_id.eq.${cleanStreamId}`)
            .single();

        if (streamError || !stream) {
            console.log('Stream not found:', cleanStreamId);
            return new NextResponse('Stream not found', { status: 404 });
        }

        console.log('Redirecting to stream URL:', stream.url);

        // Validate stream URL before redirecting
        if (!stream.url || stream.url.trim() === '') {
            console.error('Stream URL is empty for stream:', cleanStreamId);
            return new NextResponse('Stream URL not configured', { status: 500 });
        }

        // Redirect to the actual stream URL
        return NextResponse.redirect(stream.url);
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
