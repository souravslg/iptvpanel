import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function GET() {
    const session = await SonyLiv.getSession();
    return NextResponse.json({ session });
}

export async function DELETE() {
    const { error } = await SonyLiv.saveSession(null);
    if (error) return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    return NextResponse.json({ success: true });
}
