
import { chromium } from 'playwright';

const TARGET_URL = 'https://j-plus.free.nf/jtv/jtv.m3u.php';

export async function fetchJTVPlaylist() {
    let browser = null;
    try {
        console.log('Starting JTV Scraper...');
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();

        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, {
            waitUntil: 'networkidle',
            timeout: 120000
        });

        // Wait for content load
        await page.waitForSelector('body', { timeout: 30000 });

        // Additional wait for JS execution as per original script
        await page.waitForTimeout(10000);

        // Try extraction methods
        let m3uContent = '';

        // Method 1: Extract from pre/code tag
        const preContent = await page.evaluate(() => {
            const pre = document.querySelector('pre');
            const code = document.querySelector('code');
            return pre ? pre.textContent : (code ? code.textContent : null);
        });

        if (preContent && preContent.includes('#EXTM3U')) {
            m3uContent = preContent;
        } else {
            // Method 2: Get body text
            m3uContent = await page.evaluate(() => document.body.innerText);
        }

        m3uContent = m3uContent.trim();

        if (!m3uContent.startsWith('#EXTM3U')) {
            throw new Error('Retrieved content does not look like a valid M3U playlist');
        }

        // Return content and metadata instead of writing to file
        const metadata = {
            lastUpdated: new Date().toISOString(),
            size: m3uContent.length,
            status: 'Success'
        };

        console.log('JTV Playlist scraped successfully');
        return { content: m3uContent, metadata };

    } catch (error) {
        console.error('JTV Scraper Error:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Status will now be fetched from DB, so this helper might be deprecated or updated to fetch from DB in the route handler logic
export function getJTVStatus() {
    // Placeholder - status should be retrieved from DB
    return { status: 'Managed by Database' };
}
