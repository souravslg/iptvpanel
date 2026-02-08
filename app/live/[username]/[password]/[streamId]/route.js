import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
    try {
        const { username, password, streamId } = params;

        console.log('Live stream request:', { username, password, streamId });

        // Remove file extension from streamId
        const cleanStreamId = streamId.replace(/\.(ts|m3u8|mp4)$/, '');

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
                const { data: settings, error: settingsError } = await supabase
                    .from('settings')
                    .select('invalid_subscription_video')
                    .single();

                if (settingsError) {
                    console.warn('Settings table error (using default video):', settingsError.message);
                } else if (settings?.invalid_subscription_video) {
                    invalidSubVideo = settings.invalid_subscription_video;
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

        // Redirect to the actual stream URL
        return NextResponse.redirect(stream.url);
    } catch (error) {
        console.error('Stream proxy error:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}
