import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Switch active playlist
export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
        }

        // Verify playlist exists
        const { data: playlist, error: fetchError } = await supabase
            .from('playlists')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        // Deactivate all playlists
        await supabase
            .from('playlists')
            .update({ is_active: false })
            .neq('id', 0); // Update all

        // Activate the selected playlist
        const { error: updateError } = await supabase
            .from('playlists')
            .update({ is_active: true })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, playlist });
    } catch (error) {
        console.error('Error switching playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
