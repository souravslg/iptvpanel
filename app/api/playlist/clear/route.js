import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
    try {
        console.log('Clear playlist request received');

        // Delete all streams
        const { error } = await supabase
            .from('streams')
            .delete()
            .neq('id', 0); // Delete all where id is not 0 (effectively all)

        console.log('Supabase clear result:', { error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Update settings to clear last updated
        await supabase.from('settings').delete().eq('key', 'playlist_updated');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Clear playlist route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
