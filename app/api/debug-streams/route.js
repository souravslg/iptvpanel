import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || 'zee';

        const { data, error } = await supabase
            .from('streams')
            .select('id, stream_id, name, url, headers')
            .ilike('name', `%${q}%`)
            .limit(10);

        return NextResponse.json({ data, error });
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
