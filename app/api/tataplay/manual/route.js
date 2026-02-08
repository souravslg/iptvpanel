import { NextResponse } from 'next/server';
import { TataPlay } from '@/lib/tataplay';

export async function POST(request) {
    try {
        const { sid, accessToken, refreshToken, userToken } = await request.json();

        if (!sid || !accessToken) {
            return NextResponse.json({ error: 'SID and Access Token are required' }, { status: 400 });
        }

        const result = await TataPlay.saveManualSession(sid, accessToken, refreshToken, userToken);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
