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

        // Get all streams
        const { data: streams } = await supabase
            .from('streams')
            .select('*');

        // Generate M3U playlist
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const useProxy = searchParams.get('proxy') === 'true';

        let m3u = '#EXTM3U\n';

        (streams || []).forEach(stream => {
            const tvgId = stream.stream_id || stream.id;
            const tvgName = stream.name;
            const tvgLogo = stream.logo || '';
            const groupTitle = stream.category || 'Uncategorized';

            m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${tvgName}\n`;

            // Always use proxy URL to enforce authentication and expiry checks
            const streamUrl = `${protocol}://${host}/live/${username}/${password}/${tvgId}.m3u8`;
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
