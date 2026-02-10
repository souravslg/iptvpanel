
import { NextResponse } from 'next/server';
import { fetchJTVPlaylist } from '@/lib/jtv-scraper';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const { content, metadata } = await fetchJTVPlaylist();

        // 1. Store M3U Content
        const { error: contentError } = await supabase
            .from('settings')
            .upsert({
                key: 'jtv_playlist_content',
                value: content
            }, { onConflict: 'key' });

        if (contentError) throw new Error('Failed to save playlist content: ' + contentError.message);

        // 2. Store Metadata (last updated, status, etc.)
        const { error: metaError } = await supabase
            .from('settings')
            .upsert({
                key: 'jtv_metadata',
                value: JSON.stringify(metadata)
            }, { onConflict: 'key' });

        if (metaError) throw new Error('Failed to save metadata: ' + metaError.message);

        return NextResponse.json({ success: true, message: 'Playlist updated and saved to DB successfully' });
    } catch (error) {
        console.error('JTV Refresh Error:', error);

        // Try to save error state to DB
        try {
            await supabase.from('settings').upsert({
                key: 'jtv_metadata',
                value: JSON.stringify({
                    lastUpdated: new Date().toISOString(),
                    status: 'Error',
                    error: error.message
                })
            }, { onConflict: 'key' });
        } catch (e) { /* ignore */ }

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
