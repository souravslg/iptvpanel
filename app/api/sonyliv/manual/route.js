import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function POST(request) {
    try {
        const { mobileNumber, token, userId } = await request.json();

        if (!mobileNumber || !token) {
            return NextResponse.json({ error: 'Mobile number and token are required' }, { status: 400 });
        }

        const result = await SonyLiv.saveManualSession(mobileNumber, token, userId);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
