import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'jtv_playlist_content')
            .single();

        if (error || !data) {
            return new NextResponse('#EXTM3U\n#ERROR: Playlist not found or not yet generated.', { status: 404 });
        }

        return new NextResponse(data.value, {
            headers: {
                'Content-Type': 'application/x-mpegurl',
                'Content-Disposition': 'inline; filename="jtv.m3u"',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new NextResponse('#EXTM3U\n#ERROR: Internal Server Error', { status: 500 });
    }
}
