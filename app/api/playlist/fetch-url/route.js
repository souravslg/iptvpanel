import { NextResponse } from 'next/server';

// POST - Fetch M3U content from a URL (server-side to avoid CORS)
export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log('Fetching playlist from URL:', url);

        // Fetch the M3U content from the server side (no CORS issues)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            console.error('Fetch failed:', response.status, response.statusText);
            return NextResponse.json({
                error: `Failed to fetch: ${response.statusText}`
            }, { status: response.status });
        }

        const content = await response.text();
        console.log('Fetched content length:', content.length);

        if (!content || content.length === 0) {
            return NextResponse.json({ error: 'Empty response from URL' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            content,
            contentLength: content.length
        });

    } catch (error) {
        console.error('Error fetching URL:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch URL'
        }, { status: 500 });
    }
}
