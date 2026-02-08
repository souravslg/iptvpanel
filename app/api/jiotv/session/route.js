import { NextResponse } from 'next/server';
import { JioTV } from '@/lib/jiotv';

export async function GET() {
    try {
        const session = await JioTV.getSession();
        return NextResponse.json({ session });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
