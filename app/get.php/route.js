import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    let username = searchParams.get('username');
    let password = searchParams.get('password');
    const type = searchParams.get('type');

    // Only handle m3u requests
    if (type !== 'm3u' && type !== 'm3u_plus') {
        return new NextResponse('Invalid type', { status: 400 });
    }

    if (!username || !password) {
        return new NextResponse('Missing credentials', { status: 401 });
    }

    // Authenticate user
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (!user) {
        return new NextResponse('Invalid credentials', { status: 401 });
    }

    //Check if user is active
    const now = new Date();
    const expireDate = user.expire_date ? new Date(user.expire_date) : null;
    const isExpired = expireDate && expireDate < now;
    const isActive = user.status === 'Active' && !isExpired;

    if (!isActive) {
        return new NextResponse('Account expired or inactive', { status: 403 });
    }

    // Fetch all streams
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .eq('enabled', true)
        .order('id');

    // Generate M3U playlist
    let m3u = '#EXTM3U\n';

    streams?.forEach(stream => {
        const name = stream.name || 'Unnamed';
        const category = stream.category || 'General';
        const logo = stream.logo || '';

        // Add stream info
        m3u += `#EXTINF:-1 group-title="${category}" tvg-logo="${logo}",${name}\n`;

        // Add headers if present (for JTV streams)
        if (stream.headers) {
            const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;

            // Check if has cookie (JTV streams)
            const hasCookie = Object.keys(headers).some(key => key.toLowerCase() === 'cookie');

            if (hasCookie) {
                // Use EXTHTTP tag for cookie-based streams
                const cookie = headers.cookie || headers.Cookie;
                m3u += `#EXTHTTP:{"cookie":"${cookie}"}\n`;
            }
        }

        // Add stream URL
        m3u += `${stream.url}\n\n`;
    });

    return new NextResponse(m3u, {
        status: 200,
        headers: {
            'Content-Type': 'audio/x-mpegurl',
            'Content-Disposition': `attachment; filename="${username}.m3u"`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
    });
}
