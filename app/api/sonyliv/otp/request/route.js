import { NextResponse } from 'next/server';
import { SonyLiv } from '@/lib/sonyliv';

export async function POST(request) {
    try {
        const { number } = await request.json();
        if (!number) return NextResponse.json({ error: 'Number is required' }, { status: 400 });

        const result = await SonyLiv.requestOTP(number);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
