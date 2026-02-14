import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

// Helper function to generate unique playlist token
function generatePlaylistToken() {
    return crypto.randomBytes(24).toString('hex'); // 48 characters
}

// GET - Get user's playlist info
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, playlist_token, playlist_created_at, playlist_last_accessed, playlist_access_count, device_limit')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return NextResponse.json({
            userId: user.id,
            username: user.username,
            playlistToken: user.playlist_token,
            playlistUrl: user.playlist_token ? `/playlist/${user.username}/${user.playlist_token}` : null,
            createdAt: user.playlist_created_at,
            lastAccessed: user.playlist_last_accessed,
            accessCount: user.playlist_access_count || 0,
            deviceLimit: user.device_limit
        });

    } catch (error) {
        console.error('Failed to fetch playlist info:', error);
        return NextResponse.json({ error: 'Failed to fetch playlist info' }, { status: 500 });
    }
}

// POST - Generate new playlist token for user
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const playlistToken = generatePlaylistToken();

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                playlist_token: playlistToken,
                playlist_created_at: new Date().toISOString(),
                playlist_access_count: 0
            })
            .eq('id', userId)
            .select('id, username, playlist_token')
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            playlistUrl: `/playlist/${data.username}/${data.playlist_token}`,
            playlistToken: data.playlist_token
        });

    } catch (error) {
        console.error('Failed to generate playlist:', error);
        return NextResponse.json({ error: 'Failed to generate playlist' }, { status: 500 });
    }
}

// DELETE - Revoke user's playlist token
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('users')
            .update({
                playlist_token: null,
                playlist_created_at: null
            })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to revoke playlist:', error);
        return NextResponse.json({ error: 'Failed to revoke playlist' }, { status: 500 });
    }
}
