import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        // Await params before using them (Next.js 15 requirement, good practice generally)
        const { path } = await params;

        if (!path || path.length < 2) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        // 1. Decode Base URL
        // Path structure: /api/stream-proxy/<ENCODED_BASE_B64>/<...REST_OF_PATH>
        const encodedBase = path[0];
        const restOfPath = path.slice(1).join('/');

        let baseUrl;
        try {
            // Use standard base64 decoding (handle URL safe variants if needed)
            const decoded = atob(encodedBase.replace(/-/g, '+').replace(/_/g, '/'));
            baseUrl = decoded;
        } catch (e) {
            return new NextResponse('Invalid base URL encoding', { status: 400 });
        }

        // 2. Construct Target URL
        // Ensure baseUrl doesn't end with slash if restOfPath starts with it, or vice versa
        let targetUrlObj;
        try {
            targetUrlObj = new URL(restOfPath, baseUrl);
        } catch (e) {
            // Fallback
            targetUrlObj = new URL(`${baseUrl.replace(/\/$/, '')}/${restOfPath.replace(/^\//, '')}`);
        }

        // Append query parameters from the request to the target URL
        // Use raw search string to prevent re-encoding issues with sensitive tokens
        const requestUrlObj = new URL(request.url);
        let targetUrl = targetUrlObj.toString();
        if (requestUrlObj.search) {
            const separator = targetUrl.includes('?') ? '&' : '?';
            targetUrl += separator + requestUrlObj.search.substring(1);
        }

        console.log(`[StreamProxy] Fetching: ${targetUrl}`);

        // 3. Fetch
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // Forward some headers if needed, but be careful with host
            },
        });

        if (!response.ok) {
            console.error(`[StreamProxy] Failed: ${response.status} ${response.statusText} for ${targetUrl}`);
            return new NextResponse(`Upstream Error: ${response.statusText}`, {
                status: response.status,
                headers: {
                    'X-Proxy-Target': targetUrl,
                    'X-Proxy-Error': response.statusText
                }
            });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // 4. Manifest Rewriting (Advanced)
        // If it's a manifest (M3U8/MPD), we ideally want to rewrite it so that
        // RELATIVE paths are left alone (fetching from THIS proxy relative path),
        // but ABSOLUTE paths (if any) are rewritten to point to this proxy.
        // HOWEVER, since we effectively "mounted" the remote server at this proxy path,
        // relative paths in the manifest will naturally resolve to:
        // /api/stream-proxy/<ENCODED_BASE>/<segment.ts>
        // Which maps to: <BASE_URL>/<segment.ts> -> Exact match!

        // So, we ONLY need rewrite if the manifest contains ABSOLUTE URLs that drift away from <BASE_URL>.
        // For now, let's just pass through. If we see "https://" in the manifest, we might need to handle it.
        // But usually relative paths + this proxy structure is enough.

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'X-Proxy-Target': targetUrl // Useful for debugging
            },
        });

    } catch (error) {
        console.error('[StreamProxy] Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request, { params }) {
    // Handle POST (License requests, etc)
    try {
        const { path } = await params;
        const encodedBase = path[0];
        const restOfPath = path.slice(1).join('/');

        let baseUrl;
        try {
            const decoded = atob(encodedBase.replace(/-/g, '+').replace(/_/g, '/'));
            baseUrl = decoded;
        } catch (e) {
            return new NextResponse('Invalid base URL encoding', { status: 400 });
        }

        const targetUrl = new URL(restOfPath, baseUrl).toString();
        const body = await request.arrayBuffer();

        const response = await fetch(targetUrl, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': request.headers.get('content-type') || 'application/octet-stream',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });

    } catch (error) {
        console.error('[StreamProxy] POST Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
