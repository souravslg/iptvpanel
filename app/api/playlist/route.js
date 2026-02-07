
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseM3U } from '@/lib/m3u';

export async function POST(request) {
  try {
    const { content } = await request.json();
    const streams = parseM3U(content);

    if (streams.length === 0) {
      return NextResponse.json({ error: 'No streams found' }, { status: 400 });
    }

    // Get active playlist
    const { data: activePlaylist } = await supabase
      .from('playlists')
      .select('id')
      .eq('is_active', true)
      .single();

    if (!activePlaylist) {
      return NextResponse.json({ error: 'No active playlist found' }, { status: 400 });
    }

    // Delete existing streams in active playlist
    const { error: deleteError } = await supabase
      .from('streams')
      .delete()
      .eq('playlist_id', activePlaylist.id);

    if (deleteError) throw deleteError;

    // Batch Insert (Supabase has a limit, safe to do chunks of 1000)
    const chunkSize = 1000;
    for (let i = 0; i < streams.length; i += chunkSize) {
      const chunk = streams.slice(i, i + chunkSize).map(stream => ({
        stream_id: stream.id,
        name: stream.name,
        url: stream.url,
        logo: stream.logo,
        category: stream.group,
        playlist_id: activePlaylist.id
      }));

      const { error: insertError } = await supabase
        .from('streams')
        .insert(chunk);

      if (insertError) throw insertError;
    }

    // Update playlist metadata
    await supabase
      .from('playlists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activePlaylist.id);

    return NextResponse.json({ success: true, count: streams.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save playlist' }, { status: 500 });
  }
}


export async function GET() {
  try {
    // Get active playlist
    const { data: activePlaylist } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!activePlaylist) {
      return NextResponse.json({
        totalChannels: 0,
        lastUpdated: null,
        groups: [],
        sample: [],
        activePlaylist: null
      });
    }

    // Get all streams from active playlist
    const { data: sample, error: sampleError } = await supabase
      .from('streams')
      .select('*')
      .eq('playlist_id', activePlaylist.id)
      .order('id', { ascending: true });

    if (sampleError) {
      console.error('Error fetching streams:', sampleError);
      return NextResponse.json({
        totalChannels: activePlaylist.total_channels || 0,
        lastUpdated: activePlaylist.updated_at,
        groups: [],
        sample: [],
        activePlaylist,
        error: sampleError.message
      });
    }

    console.log('Playlist API Response:', {
      totalChannels: activePlaylist.total_channels || 0,
      sampleCount: sample?.length || 0,
      hasError: !!sampleError,
      playlistName: activePlaylist.name
    });

    return NextResponse.json({
      totalChannels: activePlaylist.total_channels || 0,
      lastUpdated: activePlaylist.updated_at,
      groups: [], // TODO: optimize group aggregation
      sample: sample || [],
      activePlaylist
    });
  } catch (error) {
    console.error('GET /api/playlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist data' }, { status: 500 });
  }
}

