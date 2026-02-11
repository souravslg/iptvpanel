
const TARGET_URL = 'https://j-plus.free.nf/jtv/jtv.m3u.php';

export async function fetchJTVPlaylist() {
    try {
        console.log(`Fetching JTV playlist from ${TARGET_URL}...`);

        // Direct fetch with browser headers
        // Note: Target site has anti-bot protection (Aes.js) which may block this.
        const response = await fetch(TARGET_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        // Check for JS Challenge / Anti-Bot
        if (text.includes('aes.js') || text.includes('javascript') && !text.includes('#EXTM3U')) {
            throw new Error('Target site requires JavaScript execution (Anti-Bot detected). Scraper cannot run in serverless environment.');
        }

        if (!text.trim().startsWith('#EXTM3U')) {
            throw new Error('Retrieved content does not look like a valid M3U playlist');
        }

        const metadata = {
            lastUpdated: new Date().toISOString(),
            size: text.length,
            status: 'Success'
        };

        return { content: text, metadata };

    } catch (error) {
        console.error('JTV Scraper Error:', error);
        throw error;
    }
}

export function getJTVStatus() {
    return { status: 'Managed by Database' };
}
