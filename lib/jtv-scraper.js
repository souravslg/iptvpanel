
const TARGET_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/main/jtv.m3u';

export async function fetchJTVPlaylist() {
    try {
        console.log(`Fetching JTV playlist from ${TARGET_URL}...`);

        // Direct fetch from GitHub (no anti-bot protection)
        const response = await fetch(TARGET_URL);

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
