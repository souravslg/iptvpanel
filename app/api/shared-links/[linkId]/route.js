import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get a single shared link by ID
export async function GET(request, context) {
    try {
        const params = await Promise.resolve(context.params);
        const { linkId } = params;

        const { data: link, error } = await supabase
            .from('shared_links')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Link not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(link);
    } catch (error) {
        console.error('Failed to fetch shared link:', error);
        return NextResponse.json({ error: 'Failed to fetch shared link' }, { status: 500 });
    }
}
