import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { id } = await request.json();

        console.log('Delete request received:', { id });

        if (!id) {
            console.log('Missing id');
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('streams')
            .delete()
            .eq('id', id)
            .select();

        console.log('Supabase delete result:', { data, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Delete route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
