
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseM3U } from '@/lib/m3u_v2';

export async function POST(request) {
  try {
    const { content, playlist_id } = await request.json();
    const streams = parseM3U(content);

    if (streams.length === 0) {
      return NextResponse.json({ error: 'No streams found' }, { status: 400 });
    }

    let targetPlaylistId = playlist_id;

    // If no playlist_id provided, get first active playlist or create default one
    if (!targetPlaylistId) {
      let { data: activePlaylists } = await supabase
        .from('playlists')
        .select('id')
        .eq('is_active', true);

      let activePlaylist = activePlaylists?.[0];

      // If no active playlist exists, create a default one
      if (!activePlaylist) {
        const { data: newPlaylist, error: createError } = await supabase
          .from('playlists')
          .insert({
            name: 'Default Playlist',
            description: 'Main playlist',
            is_active: true,
            total_channels: 0
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating default playlist:', createError);
          return NextResponse.json({ error: 'Failed to create default playlist' }, { status: 500 });
        }

        activePlaylist = newPlaylist;
      }

      targetPlaylistId = activePlaylist.id;
    }

    // Delete existing streams in target playlist
    const { error: deleteError } = await supabase
      .from('streams')
      .delete()
      .eq('playlist_id', targetPlaylistId);

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
        playlist_id: targetPlaylistId,
        // DRM fields from M3U parser
        drm_scheme: stream.drmScheme || null,
        drm_license_url: stream.drmLicenseUrl || null,
        drm_key_id: stream.drmKeyId || null,
        drm_key: stream.drmKey || null,
        stream_format: stream.streamFormat || 'hls',
        channel_number: stream.channelNumber || null,
        headers: stream.headers ? JSON.stringify(stream.headers) : null
      }));

      const { error: insertError } = await supabase
        .from('streams')
        .insert(chunk);

      if (insertError) throw insertError;
    }

    // Update playlist metadata and channel count
    await supabase
      .from('playlists')
      .update({
        updated_at: new Date().toISOString(),
        total_channels: streams.length
      })
      .eq('id', targetPlaylistId);

    return NextResponse.json({ success: true, imported: streams.length, playlist_id: targetPlaylistId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save playlist' }, { status: 500 });
  }
}


export async function GET() {
  try {
    // Get all active playlists
    const { data: activePlaylists, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('is_active', true);

    if (playlistError) {
      console.error('Error fetching active playlists:', playlistError);
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }

    if (!activePlaylists || activePlaylists.length === 0) {
      return NextResponse.json({
        totalChannels: 0,
        lastUpdated: null,
        groups: [],
        sample: [],
        activePlaylists: []
      });
    }

    // Get all streams from all active playlists
    const playlistIds = activePlaylists.map(p => p.id);

    // 1. Get total count efficiently (admins see all channels)
    const { count, error: countError } = await supabase
      .from('streams')
      .select('*', { count: 'exact', head: true })
      .in('playlist_id', playlistIds);

    if (countError) {
      console.error('Error counting streams:', countError);
    }

    // 2. Fetch streams with a limit to prevent timeouts/memory issues
    // TODO: Implement proper server-side pagination for full access
    // NOTE: Admins see ALL channels (enabled and disabled) for management
    const { data: allStreams, error: streamsError } = await supabase
      .from('streams')
      .select('*')
      .in('playlist_id', playlistIds)
      .order('id', { ascending: true })
      .limit(10000); // Increased limit to ensure all channels (including JTV) are fetched

    if (streamsError) {
      console.error('Error fetching streams:', streamsError);
      return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
    }

    const sampleError = null;

    if (sampleError) {
      console.error('Error fetching streams:', sampleError);
      return NextResponse.json({
        totalChannels: 0,
        lastUpdated: null,
        groups: [],
        sample: [],
        activePlaylists,
        error: sampleError.message
      });
    }

    // Calculate total channels across all active playlists
    // Use the count from the head query, or length if fallback
    const totalChannels = count || allStreams?.length || 0;

    // Get the most recent update time
    const lastUpdated = activePlaylists.reduce((latest, playlist) => {
      const playlistDate = new Date(playlist.updated_at);
      return !latest || playlistDate > latest ? playlistDate : latest;
    }, null);

    // Aggregate groups/categories
    const groupMap = {};
    allStreams?.forEach(stream => {
      const category = stream.category || 'Uncategorized';
      groupMap[category] = (groupMap[category] || 0) + 1;
    });

    const groups = Object.entries(groupMap).map(([name, count]) => ({ name, count }));

    console.log('Playlist API Response:', {
      totalChannels,
      sampleCount: allStreams?.length || 0,
      activePlaylistsCount: activePlaylists.length,
      hasError: !!sampleError,
      playlistNames: activePlaylists.map(p => p.name).join(', ')
    });

    return NextResponse.json({
      totalChannels,
      lastUpdated: lastUpdated?.toISOString() || null,
      groups,
      sample: allStreams || [],
      activePlaylists,
      activePlaylist: activePlaylists[0] // For backward compatibility
    });
  } catch (error) {
    console.error('GET /api/playlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist data' }, { status: 500 });
  }
}

