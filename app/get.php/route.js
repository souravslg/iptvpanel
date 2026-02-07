import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const id = searchParams.get('stream_id');
    const type = searchParams.get('type') || 'm3u_plus';

    if (!username || !password) {
        return new NextResponse('Authentication Failed', { status: 401 });
    }

    // Authenticate User
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !user || user.status !== 'Active') {
        return new NextResponse('Authentication Failed', { status: 401 });
    }

    // Handle M3U Download Request
    if (!id) {
        const { data: streams } = await supabase.from('streams').select('*');

        if (!streams) return new NextResponse('#EXTM3U', { status: 200 });

        let m3u = `#EXTM3U\n`;

        streams.forEach(s => {
            const host = request.headers.get('host');
            const streamUrl = `http://${host}/get.php?username=${username}&password=${password}&stream_id=${s.id}`;
            m3u += `#EXTINF:-1 tvg-id="" tvg-name="${s.name}" tvg-logo="${s.logo}" group-title="${s.category}",${s.name}\n${streamUrl}\n`;
        });

        return new NextResponse(m3u, {
            headers: {
                'Content-Type': 'audio/x-mpegurl',
                'Content-Disposition': `attachment; filename="${username}.m3u"`
            }
        });

    } else {
        // Handle Stream Redirect
        const streamId = id.replace(/\.(ts|m3u8)$/, '');

        const { data: stream } = await supabase
            .from('streams')
            .select('url')
            .eq('id', streamId)
            .single();

        if (stream) {
            return NextResponse.redirect(stream.url);
        } else {
            return new NextResponse('Stream Not Found', { status: 404 });
        }
    }
}
