const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Playwright Scraper...');
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();

        console.log('Navigating to target URL...');
        // Target URL provided by user
        await page.goto('https://raw.githubusercontent.com/souravslg/iptvpanel/main/jtv.m3u', {
            waitUntil: 'networkidle',
            timeout: 120000
        });

        // Wait for potential anti-bot redirects or JS challenges
        console.log('Waiting for page load and challenges...');
        await page.waitForTimeout(10000); // Initial wait

        // Check if we need to wait for a specific selector (like body) to ensure it's not the loading screen
        try {
            await page.waitForSelector('body', { timeout: 30000 });
        } catch (e) {
            console.log('Timeout waiting for body, proceeding anyway...');
        }

        // Additional wait to be safe (Aes.js usually takes ~5-8 seconds)
        await page.waitForTimeout(5000);

        // Get page content
        console.log('Extracting content...');
        let content = await page.content();
        let m3uContent = '';

        // Method 1: Extract from <pre> tag (common for text responses viewed in browser)
        const preContent = await page.evaluate(() => {
            const pre = document.querySelector('pre');
            return pre ? pre.innerText : null;
        });

        if (preContent && preContent.includes('#EXTM3U')) {
            m3uContent = preContent;
        } else {
            // Method 2: Get full body text
            const bodyText = await page.evaluate(() => document.body.innerText);
            if (bodyText.includes('#EXTM3U')) {
                m3uContent = bodyText;
            } else {
                // Method 3: Sometimes it's directly in the HTML if the browser renders it as text
                if (content.includes('#EXTM3U')) {
                    // Try to clean HTML tags if necessary, or regex extract
                    // Simple regex to find M3U content if mixed with HTML
                    const match = content.match(/(#EXTM3U[\s\S]*)/);
                    if (match) m3uContent = match[1];
                }
            }
        }

        if (!m3uContent || !m3uContent.includes('#EXTM3U')) {
            throw new Error('Could not find #EXTM3U in page content');
        }

        // Clean up content (remove potential HTML artifacts if Method 3 was fuzzy, but header check helps)
        // Most crucial is that it starts with #EXTM3U
        m3uContent = m3uContent.trim();
        if (m3uContent.includes('</body>')) {
            m3uContent = m3uContent.split('</body>')[0]; // Naive cleanup if regex failed
        }

        const outputPath = path.join(process.cwd(), 'jtv.m3u');
        fs.writeFileSync(outputPath, m3uContent);

        console.log('Successfully saved jtv.m3u');
        console.log('Size:', m3uContent.length, 'bytes');
        console.log('Preview:', m3uContent.substring(0, 100));

    } catch (error) {
        console.error('Scraping failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
