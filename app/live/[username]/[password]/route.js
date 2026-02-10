
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    const params = await Promise.resolve(context.params);
    return new NextResponse(`Level 2 OK: ${params.username}/${params.password}`);
}
