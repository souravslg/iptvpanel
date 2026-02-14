import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get user's channel permissions
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('user_channel_permissions')
            .select('id, stream_id, allowed, created_at')
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json(data || []);

    } catch (error) {
        console.error('Failed to fetch channel permissions:', error);
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
}

// POST - Assign channels to user
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, streamIds, allowed = true } = body;

        if (!userId || !streamIds || !Array.isArray(streamIds)) {
            return NextResponse.json({ error: 'userId and streamIds array required' }, { status: 400 });
        }

        // Create permission records for each stream
        const permissions = streamIds.map(streamId => ({
            user_id: parseInt(userId),
            stream_id: parseInt(streamId),
            allowed
        }));

        const { data, error } = await supabaseAdmin
            .from('user_channel_permissions')
            .upsert(permissions, {
                onConflict: 'user_id,stream_id'
            })
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, count: data.length });

    } catch (error) {
        console.error('Failed to assign channels:', error);
        return NextResponse.json({ error: 'Failed to assign channels' }, { status: 500 });
    }
}

// DELETE - Remove channel permissions
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const streamId = searchParams.get('streamId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from('user_channel_permissions')
            .delete()
            .eq('user_id', userId);

        if (streamId) {
            query = query.eq('stream_id', streamId);
        }

        const { error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to remove permissions:', error);
        return NextResponse.json({ error: 'Failed to remove permissions' }, { status: 500 });
    }
}
