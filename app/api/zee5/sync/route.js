import { NextResponse } from 'next/server';
import { Zee5 } from '@/lib/zee5';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const channels = await Zee5.fetchChannels();
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
            return NextResponse.json({ error: 'No active playlist found. Please create/activate a playlist first.' }, { status: 404 });
        }

        const streamData = channels.map(ch => ({
            playlist_id: activePlaylist.id,
            stream_id: ch.stream_id,
            name: ch.name,
            url: ch.url,
            logo: '',
            category: 'Zee5',
            type: 'live',
            headers: ch.userAgent ? JSON.stringify({ 'User-Agent': ch.userAgent }) : null
        }));

        const { error: upsertError } = await supabase
            .from('streams')
            .upsert(streamData, { onConflict: 'playlist_id,stream_id' });

        if (upsertError) {
            console.error('Zee5 Upsert Error:', upsertError);
            return NextResponse.json({ error: upsertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: streamData.length });
    } catch (e) {
        console.error('Zee5 Sync Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
