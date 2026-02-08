import { NextResponse } from 'next/server';
import { JioTV } from '@/lib/jiotv';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const session = await JioTV.getSession();
        if (!session) {
            return NextResponse.json({ error: 'JioTV not logged in' }, { status: 401 });
        }

        const rawChannels = await JioTV.fetchChannels();
        if (!rawChannels || rawChannels.length === 0) {
            return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
        }

        // 1. Ensure "JioTV" playlist exists
        let { data: playlist } = await supabase
            .from('playlists')
            .select('id')
            .eq('name', 'JioTV')
            .single();

        if (!playlist) {
            const { data: newPlaylist, error: pError } = await supabase
                .from('playlists')
                .insert({
                    name: 'JioTV',
                    is_active: true,
                    total_channels: 0
                })
                .select()
                .single();
            if (pError) throw pError;
            playlist = newPlaylist;
        }

        // 2. Clear old JioTV streams
        await supabase.from('streams').delete().eq('playlist_id', playlist.id);

        // 3. Format and Insert new channels
        const formattedStreams = rawChannels.map(ch => ({
            playlist_id: playlist.id,
            stream_id: `jiotv-${ch.channel_id}`,
            name: ch.channel_name,
            logo: `https://jiotv.data.cdn.jio.com/apis/v1.4/get_channel_logo?channel_id=${ch.channel_id}`,
            category: ch.channel_category_name || 'JioTV',
            url: `https://jiotv.com/watch/live/${ch.channel_name.replace(/\s+/g, '-').toLowerCase()}`, // Placeholder, handled by proxy
            stream_format: 'hls',
            headers: JSON.stringify({
                'User-Agent': 'JioTV',
                'Referer': 'https://www.jiotv.com/',
                'Origin': 'https://www.jiotv.com'
            })
        }));

        const chunkSize = 500;
        for (let i = 0; i < formattedStreams.length; i += chunkSize) {
            await supabase.from('streams').insert(formattedStreams.slice(i, i + chunkSize));
        }

        // 4. Update playlist count
        await supabase
            .from('playlists')
            .update({ total_channels: formattedStreams.length, updated_at: new Date().toISOString() })
            .eq('id', playlist.id);

        return NextResponse.json({
            success: true,
            count: formattedStreams.length,
            message: `Synced ${formattedStreams.length} JioTV channels`
        });
    } catch (error) {
        console.error('JioTV Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
