import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
        }

        const { data: channel, error } = await supabase
            .from('streams')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching channel:', error);
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        return NextResponse.json({ channel });
    } catch (error) {
        console.error('Error in channel API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
