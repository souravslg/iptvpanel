import { NextResponse } from 'next/server';
import { TataPlay } from '@/lib/tataplay';

export async function GET() {
    const session = await TataPlay.getSession();
    return NextResponse.json({ loggedIn: !!session, session });
}

export async function DELETE() {
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('settings').delete().eq('key', 'tataplay_session');
    return NextResponse.json({ success: true });
}
