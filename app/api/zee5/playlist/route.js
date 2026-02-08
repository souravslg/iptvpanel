import { NextResponse } from 'next/server';
import { Zee5 } from '@/lib/zee5';

export async function GET() {
    try {
        const m3u = await Zee5.generateM3U();

        return new NextResponse(m3u, {
            headers: {
                'Content-Type': 'application/x-mpegurl',
                'Content-Disposition': 'attachment; filename="zee5_playlist.m3u"'
            }
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
