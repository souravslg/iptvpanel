const fetch = require('node-fetch'); // Assuming node-fetch is available or using native fetch in newer node

const url = 'https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u';

async function inspectTop() {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lines = text.split('\n').slice(0, 20);
        console.log(lines.join('\n'));
    } catch (e) {
        console.error(e);
    }
}

inspectTop();
