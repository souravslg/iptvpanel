// Test the proxy directly with actual requests
const baseUrl = 'http://localhost:3000';

async function testProxy() {
    console.log('=== Testing Proxy Directly ===\n');

    // First, get a playlist to see what stream IDs are generated
    console.log('1. Getting playlist to see stream IDs...');
    const playlistRes = await fetch(`${baseUrl}/api/get?username=22&password=22`);
    const playlistText = await playlistRes.text();

    if (playlistText.includes('Account Expired')) {
        console.log('❌ User 22 is expired. Need an active user for testing.');
        console.log('\nFirst, let me check what the issue is...');
        console.log('Playlist response:', playlistText);
        return;
    }

    // Extract first proxy URL from the playlist
    const lines = playlistText.split('\n');
    let firstProxyUrl = null;

    for (const line of lines) {
        if (line.includes('/live/')) {
            firstProxyUrl = line.trim();
            break;
        }
    }

    if (!firstProxyUrl) {
        console.log('✅ No proxy URLs found - currently using direct URLs');
        console.log('\nThis means the previous fix is still active.');
        console.log('To test the proxy, we need to:');
        console.log('1. Find what stream IDs exist in the database');
        console.log('2. Try accessing them via the proxy directly');

        // Try accessing a known stream ID via proxy
        const testUrls = [
            `${baseUrl}/live/22/22/1002.ts`,
            `${baseUrl}/live/22/22/1.ts`,
            `${baseUrl}/live/22/22/100.ts`,
        ];

        console.log('\n2. Testing proxy with sample stream IDs...\n');

        for (const url of testUrls) {
            console.log(`Testing: ${url}`);
            try {
                const res = await fetch(url, { redirect: 'manual' });
                console.log(`  Status: ${res.status}`);

                if (res.status === 302 || res.status === 307) {
                    console.log(`  ✅ Redirected to: ${res.headers.get('location')?.substring(0, 80)}...`);
                } else if (res.status === 404) {
                    const text = await res.text();
                    if (text.includes('not found in active playlists')) {
                        console.log(`  ❌ Stream not found in database`);
                    } else {
                        console.log(`  ❌ 404 - ${text.substring(0, 100)}`);
                    }
                } else {
                    const preview = await res.text();
                    console.log(`  Response: ${preview.substring(0, 100)}`);
                }
            } catch (err) {
                console.log(`  ❌ Error: ${err.message}`);
            }
            console.log('');
        }

        return;
    }

    console.log(`\nFound proxy URL: ${firstProxyUrl}\n`);
    console.log('2. Testing proxy URL...');

    try {
        const res = await fetch(firstProxyUrl, { redirect: 'manual' });
        console.log('Status:', res.status);
        console.log('Headers:', Object.fromEntries(res.headers.entries()));

        if (res.status === 302 || res.status === 307) {
            console.log('✅ Proxy working! Redirects to:', res.headers.get('location'));
        } else {
            const text = await res.text();
            console.log('❌ Proxy failed');
            console.log('Response:', text.substring(0, 500));
        }
    } catch (err) {
        console.log('❌ Error:', err.message);
    }
}

testProxy().catch(console.error);
