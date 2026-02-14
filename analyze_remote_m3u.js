const fs = require('fs');

const URL = 'https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u';

async function analyze() {
    console.log('Fetching M3U...');
    try {
        const response = await fetch(URL);
        const text = await response.text();
        const lines = text.split('\n');

        console.log(`Total lines: ${lines.length}`);

        let matchCount = 0;
        lines.forEach((line, index) => {
            if (line.includes('KODIPROP') || line.toLowerCase().includes('drm') || line.includes('license') || line.includes('clearkey')) {
                console.log(`Line ${index + 1}: ${line}`);
                matchCount++;
            }
        });

        if (matchCount === 0) {
            console.log('No DRM/KODIPROP/License tags found.');
        } else {
            console.log(`Found ${matchCount} lines with interesting tags.`);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

analyze();
