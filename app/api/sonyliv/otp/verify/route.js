import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function POST(request) {
    try {
        const { number, otp } = await request.json();
        if (!number || !otp) return NextResponse.json({ error: 'Number and OTP are required' }, { status: 400 });

        const result = await SonyLiv.verifyOTP(number, otp);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
