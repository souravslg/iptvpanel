
import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'jtv_metadata')
            .single();

        if (data && data.value) {
            return NextResponse.json(JSON.parse(data.value));
        }

        return NextResponse.json({ status: 'Never Run', lastUpdated: null });
    } catch (error) {
        return NextResponse.json({ status: 'Error', error: error.message }, { status: 500 });
    }
}
