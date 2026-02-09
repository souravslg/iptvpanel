
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://j-plus.free.nf/jtv/jtv.m3u.php';
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'jtv.m3u');
const METADATA_FILE = path.join(process.cwd(), 'public', 'jtv-metadata.json');

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

        // Save to file
        fs.writeFileSync(OUTPUT_FILE, m3uContent);

        // Save metadata
        const metadata = {
            lastUpdated: new Date().toISOString(),
            size: m3uContent.length,
            status: 'Success'
        };
        fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

        console.log('JTV Playlist updated successfully');
        return true;

    } catch (error) {
        console.error('JTV Scraper Error:', error);

        // Save error metadata
        const metadata = {
            lastUpdated: new Date().toISOString(), // Still update time to show attempt
            status: 'Error',
            error: error.message
        };
        // Only write metadata if file doesn't exist or we want to log the error state
        try {
            const existing = fs.existsSync(METADATA_FILE) ? JSON.parse(fs.readFileSync(METADATA_FILE)) : {};
            fs.writeFileSync(METADATA_FILE, JSON.stringify({ ...existing, ...metadata }, null, 2));
        } catch (e) {
            console.error('Failed to write metadata', e);
        }

        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export function getJTVStatus() {
    try {
        if (fs.existsSync(METADATA_FILE)) {
            return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
        }
        return { status: 'Never Run' };
    } catch (error) {
        return { status: 'Error reading status', error: error.message };
    }
}
