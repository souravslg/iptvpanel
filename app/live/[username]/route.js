
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    const params = await Promise.resolve(context.params);
    console.log('Level 1 Dynamic Hit:', params);
    return new NextResponse(`Level 1 OK: ${params.username}`);
}
