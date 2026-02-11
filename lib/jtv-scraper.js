
const TARGET_URL = 'https://j-plus.free.nf/jtv/jtv.m3u.php';

export async function fetchJTVPlaylist() {
    try {
        console.log(`Fetching JTV playlist from ${TARGET_URL}...`);

        // Vercel Serverless/Edge compatible fetch
        const response = await fetch(TARGET_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
