import { NextResponse } from 'next/server';
import { JioTV } from '@/lib/jiotv';

export async function POST(request) {
    try {
        const { number, otp } = await request.json();
        if (!number || !otp) {
            return NextResponse.json({ error: 'Number and OTP are required' }, { status: 400 });
        }

        const result = await JioTV.verifyOTP(number, otp);
        if (result.error || !result.authToken) {
            return NextResponse.json({ error: result.message || 'Verification failed' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Logged in successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
