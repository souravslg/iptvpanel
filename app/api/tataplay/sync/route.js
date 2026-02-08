import { NextResponse } from 'next/server';
import { TataPlay } from '@/lib/tataplay';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const session = await TataPlay.getSession();
        if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

        const channels = await TataPlay.fetchChannels();
        if (!channels || channels.length === 0) {
            // If API returns empty, try to fetch a static list from a reliable source or return error
            return NextResponse.json({ error: 'No channels found or API restricted' });
        }

        const { data: activePlaylist } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true)
            .single();

        if (!activePlaylist) {
            return NextResponse.json({ error: 'No active playlist found.' });
        }

        const streamData = channels.map(ch => ({
            playlist_id: activePlaylist.id,
            name: ch.name,
            stream_id: ch.stream_id,
            url: `https://panel.srvcreation.com/live-proxy?id=${ch.stream_id}`,
            logo: ch.image,
            category: 'Tata Play',
            headers: JSON.stringify({
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://watch.tataplay.com'
            })
        }));

        const { error } = await supabase
            .from('streams')
            .upsert(streamData, { onConflict: 'playlist_id,stream_id' });

        if (error) throw error;

        return NextResponse.json({ success: true, count: streamData.length });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
