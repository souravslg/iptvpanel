import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function POST(request) {
    const { mobileNumber } = await request.json();
    if (!mobileNumber) {
        return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const result = await SonyLiv.requestOTP(mobileNumber);
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
}
