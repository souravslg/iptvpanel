import { NextResponse } from 'next/server';

export async function GET(request, context) {
    try {
        // Get the stream URL from query params
        const { searchParams } = new URL(request.url);
        const streamUrl = searchParams.get('url');

        if (!streamUrl) {
            return new NextResponse('Stream URL is required', { status: 400 });
        }

        console.log('Proxying stream:', streamUrl);

        // Fetch the stream
        const response = await fetch(streamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            console.error('Stream fetch failed:', response.status, response.statusText);
            return new NextResponse(`Failed to fetch stream: ${response.statusText}`, {
                status: response.status
            });
        }

        // Get the content type
        const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';

        // Stream the response
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('Stream proxy error:', error);
        return new NextResponse(`Server error: ${error.message}`, { status: 500 });
    }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
