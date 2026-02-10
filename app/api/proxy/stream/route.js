import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return new NextResponse('Missing URL parameter', { status: 400 });
        }

        // Fetch the stream content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            console.error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
            return new NextResponse(`Failed to fetch stream: ${response.statusText}`, { status: response.status });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Rewrite M3U8 playlists to proxy segments and keys
        if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(data);

            // Use the final URL (after redirects) as the base for relative paths
            const baseUrl = new URL(response.url);

            const lines = text.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                // Handle Key URIs
                if (trimmed.startsWith('#EXT-X-KEY:')) {
                    return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                        try {
                            const absoluteUrl = new URL(uri, baseUrl).toString();
                            const proxyUrl = `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
                            return `URI="${proxyUrl}"`;
                        } catch (e) {
                            return match;
                        }
                    });
                }

                // Handle Segment URIs (lines that are not comments/tags)
                if (!trimmed.startsWith('#')) {
                    try {
                        const absoluteUrl = new URL(trimmed, baseUrl).toString();
                        return `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
                    } catch (e) {
                        return line;
                    }
                }

                return line;
            });

            return new NextResponse(rewrittenLines.join('\n'), {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        // Return binary data for segments/fragments
        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Handle POST requests (e.g., DRM license requests)
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return new NextResponse('Missing URL parameter', { status: 400 });
        }

        // Get request body
        const body = await request.arrayBuffer();

        // Forward the request
        const response = await fetch(url, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': request.headers.get('content-type') || 'application/octet-stream',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            console.error(`Proxy POST fetch failed: ${response.status} ${response.statusText}`);
            return new NextResponse(`Failed to fetch license: ${response.statusText}`, { status: response.status });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });

    } catch (error) {
        console.error('Proxy POST error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
