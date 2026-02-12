import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { id, enabled } = await request.json();

        if (!id || typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('streams')
            .update({ enabled })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating channel status:', error);
            return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Toggle status error:', error);
        return NextResponse.json({ error: 'Failed to toggle status' }, { status: 500 });
    }
}
