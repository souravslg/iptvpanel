import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function GET() {
    const session = await SonyLiv.getSession();
    return NextResponse.json({ loggedIn: !!session, session });
}

export async function DELETE() {
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('settings').delete().eq('key', 'sonyliv_session');
    return NextResponse.json({ success: true });
}
