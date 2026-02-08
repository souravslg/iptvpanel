import { NextResponse } from 'next/server';
import { JioTV } from '@/lib/jiotv';

export async function POST(request) {
    try {
        const { number } = await request.json();
        if (!number || number.length !== 10) {
            return NextResponse.json({ error: 'Valid 10-digit mobile number required' }, { status: 400 });
        }

        const result = await JioTV.requestOTP(number);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
