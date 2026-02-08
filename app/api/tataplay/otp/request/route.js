import { NextResponse } from 'next/server';
import { TataPlay } from '@/lib/tataplay';

export async function POST(request) {
    try {
        const { sid } = await request.json();
        if (!sid) return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });

        const result = await TataPlay.requestOTP(sid);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
