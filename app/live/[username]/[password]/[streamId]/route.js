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

        if (!isActive) {
            // Fetch invalid subscription video URL from settings
            const { data: settings } = await supabase
                .from('settings')
                .select('invalid_subscription_video')
                .single();

            const invalidSubVideo = settings?.invalid_subscription_video ||
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

            console.log('User inactive/expired, redirecting to invalid subscription video');
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
