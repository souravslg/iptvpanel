
import { fetchJTVPlaylist } from './lib/jtv-scraper.js';

async function test() {
    try {
        console.log('Testing fetchJTVPlaylist...');
        const result = await fetchJTVPlaylist();
        console.log('Success!');
        console.log('Content Start:', result.content.substring(0, 100));
        console.log('Metadata:', result.metadata);
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

test();
