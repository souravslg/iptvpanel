import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Toggle playlist active state (allows multiple active playlists)
export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
        }

        // Get current playlist state
        const { data: playlist, error: fetchError } = await supabase
            .from('playlists')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !playlist) {
            return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
        }

        // Toggle the active state
        const newActiveState = !playlist.is_active;

        const { error: updateError } = await supabase
            .from('playlists')
            .update({ is_active: newActiveState })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            playlist: { ...playlist, is_active: newActiveState },
            message: newActiveState ? 'Playlist activated' : 'Playlist deactivated'
        });
    } catch (error) {
        console.error('Error toggling playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
