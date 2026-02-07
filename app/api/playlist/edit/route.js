import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { id, url } = await request.json();

        console.log('Edit request received:', { id, url });

        if (!id || !url) {
            console.log('Missing id or url');
            return NextResponse.json({ error: 'Missing id or url' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('streams')
            .update({ url })
            .eq('id', id)
            .select();

        console.log('Supabase update result:', { data, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Edit route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
