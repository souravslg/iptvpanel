
import { NextResponse } from 'next/server';
import { fetchJTVPlaylist } from '@/lib/jtv-scraper';

export async function POST() {
    try {
        await fetchJTVPlaylist();
        return NextResponse.json({ success: true, message: 'Playlist updated successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
