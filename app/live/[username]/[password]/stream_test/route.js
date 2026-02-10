
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    console.error('ANTIGRAVITY_LOG: STATIC ROUTE HIT');
    return new NextResponse('Static Route OK');
}
