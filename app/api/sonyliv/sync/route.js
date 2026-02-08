import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const session = await SonyLiv.getSession();
        if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

        const channels = await SonyLiv.fetchChannels();
        if (!channels || channels.length === 0) {
            return NextResponse.json({ error: 'No channels found' });
        }

        // Fetch active playlist to sync into
        const { data: activePlaylist } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true)
            .single();

        if (!activePlaylist) {
            return NextResponse.json({ error: 'No active playlist found. Create one first.' });
        }

        // Upsert channels into 'streams' table
        const streamData = channels.map(ch => ({
            playlist_id: activePlaylist.id,
            name: ch.name,
            stream_id: ch.stream_id,
            url: `https://panel.srvcreation.com/live-proxy?id=${ch.stream_id}`, // Point to our proxy
            logo: ch.image,
            category: 'SonyLiv',
            headers: JSON.stringify({
                'User-Agent': 'SonyLiv',
                'Origin': 'https://www.sonyliv.com'
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
