// Quick test to see current status of localhost proxy

async function quickProxyTest() {
    console.log('=== Quick Proxy Test ===\n');

    // Test Colors HD
    const url = 'http://localhost:3000/live/shiv/shiv1/144.mpd';

    console.log('Testing:', url);
    console.log('');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            redirect: 'manual'
        });

        clearTimeout(timeout);

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Type: ${response.type}`);

        if (response.status === 200) {
            const contentType = response.headers.get('content-type');
            console.log(`Content-Type: ${contentType}`);

            const text = await response.text();
            console.log(`Response length: ${text.length} bytes`);

            if (text.includes('<?xml') && text.includes('MPD')) {
                console.log('✅ Valid DASH manifest received');
            } else {
                console.log('❌ Not a valid DASH manifest');
                console.log('First 200 chars:', text.substring(0, 200));
            }
        } else if (response.status === 302) {
            const location = response.headers.get('location');
            console.log('⚠️  Still redirecting');
            console.log('Location:', location?.substring(0, 100));
        } else if (response.status === 451) {
            console.log('❌ 451 Error - JioTV blocked the request');
        } else {
            const text = await response.text();
            console.log('Error:', text.substring(0, 300));
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('❌ Request timeout after 10 seconds');
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

quickProxyTest();
