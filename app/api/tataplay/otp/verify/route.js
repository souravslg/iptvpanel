import { NextResponse } from 'next/server';
import { TataPlay } from '@/lib/tataplay';

export async function POST(request) {
    try {
        const { sid, otp } = await request.json();
        if (!sid || !otp) return NextResponse.json({ error: 'SID and OTP are required' }, { status: 400 });

        const result = await TataPlay.verifyOTP(sid, otp);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
