import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function POST(request) {
    const { mobileNumber, otp } = await request.json();
    if (!mobileNumber || !otp) {
        return NextResponse.json({ error: 'Mobile number and OTP are required' }, { status: 400 });
    }

    const result = await SonyLiv.verifyOTP(mobileNumber, otp);
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
}
