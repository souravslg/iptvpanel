import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List all playlists
export async function GET() {
    try {
        const { data: playlists, error } = await supabase
            .from('playlists')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ playlists: playlists || [] });
    } catch (error) {
        console.error('Error fetching playlists:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create a new playlist
export async function POST(request) {
    try {
        const { name, description, sourceUrl } = await request.json();

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
        }

        // Check if playlist name already exists
        const { data: existing } = await supabase
            .from('playlists')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Playlist name already exists' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('playlists')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                source_url: sourceUrl?.trim() || null,
                is_active: false,
                total_channels: 0
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, playlist: data });
    } catch (error) {
        console.error('Error creating playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a playlist
export async function DELETE(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
        }

        // Check if this is the active playlist
        const { data: playlist } = await supabase
            .from('playlists')
            .select('is_active, name')
            .eq('id', id)
            .single();

        if (playlist?.is_active) {
            return NextResponse.json({
                error: 'Cannot delete the active playlist. Please switch to another playlist first.'
            }, { status: 400 });
        }

        // Delete the playlist (streams will be cascade deleted)
        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update a playlist
export async function PUT(request) {
    try {
        const { id, is_active, name, description, source_url } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
        }

        const updates = {
            updated_at: new Date().toISOString()
        };

        if (typeof is_active !== 'undefined') {
            updates.is_active = is_active;
        }

        if (name !== undefined) {
            if (!name.trim()) {
                return NextResponse.json({ error: 'Playlist name cannot be empty' }, { status: 400 });
            }
            updates.name = name.trim();
        }

        if (description !== undefined) {
            updates.description = description?.trim() || null;
        }

        if (source_url !== undefined) {
            updates.source_url = source_url?.trim() || null;
        }

        const { data, error } = await supabase
            .from('playlists')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, playlist: data });
    } catch (error) {
        console.error('Error updating playlist:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
