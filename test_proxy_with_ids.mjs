// Test proxy with stream IDs that should exist
const baseUrl = 'http://localhost:3000';

async function testProxyWithKnownIds() {
    console.log('=== Testing Proxy with Known Stream IDs ===\n');

    // Get the generated playlist to extract what stream IDs are in use
    const res = await fetch(`${baseUrl}/api/get?username=22&password=22`);
    const text = await res.text();

    console.log('Playlist status:', res.status);
    console.log('Playlist size:', text.length, 'bytes\n');

    // Extract stream IDs from the EXTINF lines
    const lines = text.split('\n');
    const streamIds = new Set();

    for (const line of lines) {
        const m = line.match(/tvg-id="(\d+)"/);
        if (m) {
            streamIds.add(m[1]);
        }
    }

    const ids = Array.from(streamIds).slice(0, 3);
    console.log('Found stream IDs in playlist:', ids);
    console.log('\nNow testing proxy with these IDs...\n');

    for (const id of ids) {
        const proxyUrl = `${baseUrl}/live/22/22/${id}.ts`;
        console.log(`Testing: ${proxyUrl}`);

        try {
            const proxyRes = await fetch(proxyUrl, { redirect: 'manual' });
            console.log(`  Status: ${proxyRes.status}`);

            if (proxyRes.status === 302 || proxyRes.status === 307) {
                const location = proxyRes.headers.get('location');
                console.log(`  ✅ SUCCESS - Redirects to: ${location?.substring(0, 100)}...`);
            } else if (proxyRes.status === 404) {
                const errorText = await proxyRes.text();
                console.log(`  ❌ 404 - ${errorText.substring(0, 150)}`);
            } else {
                const errorText = await proxyRes.text();
                console.log(`  ⚠️  ${proxyRes.status} - ${errorText.substring(0, 150)}`);
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
        }
        console.log('');
    }
}

testProxyWithKnownIds().catch(console.error);
