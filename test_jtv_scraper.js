import { fetchJTVPlaylist } from './lib/jtv-scraper.js';

async function test() {
    try {
        console.log('Testing JTV Scraper...');
        const result = await fetchJTVPlaylist();
        console.log('Scrape successful.');
        console.log('Metadata:', result.metadata);
        console.log('Content Length:', result.content.length);
    } catch (e) {
        console.error('Scrape failed:', e);
    }
}

test();
