const https = require('https');

async function testFetch() {
    const url = 'https://j-plus.free.nf/jtv/jtv.m3u.php';
    console.log(`Fetching ${url}...`);

    try {
        // Create an agent that ignores self-signed certificates if necessary (though free.nf usually has valid ones, but curl failed)
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const response = await fetch(url, {
            agent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Sample content:');
        console.log(text); // Print everything

        if (text.includes('#EXTM3U')) {
            console.log('SUCCESS: Retrieved M3U content.');
        } else {
            console.log('WARNING: Content does not look like M3U.');
        }

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

testFetch();
