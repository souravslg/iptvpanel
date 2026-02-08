import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const channels = await SonyLiv.fetchChannels();
        if (!channels || channels.length === 0) {
            return NextResponse.json({ error: 'No channels found' }, { status: 404 });
        }

        // Get the active playlist
        const { data: activePlaylist } = await supabase
            .from('playlists')
            .select('id')
            .eq('is_active', true)
            .single();

        if (!activePlaylist) {
            return NextResponse.json({ error: 'No active playlist found' }, { status: 404 });
        }

        let addedCount = 0;
        for (const ch of channels) {
            const { error } = await supabase
                .from('streams')
                .upsert({
                    playlist_id: activePlaylist.id,
                    stream_id: ch.stream_id,
                    name: ch.name,
                    url: 'PROXY', // Managed by proxy
                    logo: ch.image,
                    category: 'SonyLiv',
                    type: 'live'
                }, { onConflict: 'stream_id' });

            if (!error) addedCount++;
        }

        return NextResponse.json({ success: true, count: addedCount });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
