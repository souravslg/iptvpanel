
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

    // Delete existing streams
    const { error: deleteError } = await supabase
      .from('streams')
      .delete()
      .neq('id', 0); // Delete all where id is not 0 (effectively all)

    if (deleteError) throw deleteError;

    // Batch Insert (Supabase has a limit, safe to do chunks of 1000)
    const chunkSize = 1000;
    for (let i = 0; i < streams.length; i += chunkSize) {
      const chunk = streams.slice(i, i + chunkSize).map(stream => ({
        stream_id: stream.id,
        name: stream.name,
        url: stream.url,
        logo: stream.logo,
        category: stream.group
      }));

      const { error: insertError } = await supabase
        .from('streams')
        .insert(chunk);

      if (insertError) throw insertError;
    }

    // Update settings
    await supabase.from('settings').upsert({ key: 'playlist_updated', value: new Date().toISOString() });

    return NextResponse.json({ success: true, count: streams.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save playlist' }, { status: 500 });
  }
}


export async function GET() {
  try {
    const { count } = await supabase.from('streams').select('*', { count: 'exact', head: true });

    // Last Updated
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'playlist_updated').single();
    const lastUpdated = setting?.value;

    // Groups (This is expensive in basic Supabase without Views or RPC, so we might skip or do a simple fetch)
    // A simplified approach: we won't aggregate groups in API for now to avoid fetching all rows.
    // Or we can fetch distinct categories if the number is small.
    // For now, let's just return a sample and total count.

    // Sample
    const { data: sample } = await supabase.from('streams').select('*').limit(50);

    return NextResponse.json({
      totalChannels: count || 0,
      lastUpdated,
      groups: [], // TODO: optimize group aggregation
      sample: sample || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlist data' }, { status: 500 });
  }
}

