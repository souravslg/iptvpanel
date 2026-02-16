// Test if Vercel live proxy endpoint is working

async function testVercelProxy() {
    const baseUrl = 'https://admin.iptvindia.co.in';
    const username = 'shiv';
    const password = 'shiv1';
    const streamId = '144'; // Colors HD

    console.log('=== Testing Vercel Live Proxy ===\n');

    const proxyUrl = `${baseUrl}/live/${username}/${password}/${streamId}.mpd`;
    console.log('Testing:', proxyUrl);
    console.log('');

    try {
        const response = await fetch(proxyUrl, {
            redirect: 'manual' // Don't follow redirects
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Type: ${response.type}`);

        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType || 'none'}`);

        if (response.status === 200) {
            const text = await response.text();
            console.log(`Response length: ${text.length} bytes`);

            // Check if it's a valid MPD manifest
            if (text.includes('<?xml') && text.includes('MPD')) {
                console.log('✅ Valid DASH manifest received');

                // Check if URLs in manifest are rewritten to proxy
                if (text.includes('/api/proxy/stream')) {
                    console.log('✅ Manifest URLs rewritten to use proxy');
                } else if (text.includes('jiotv')) {
                    console.log('⚠️  Manifest contains direct JioTV URLs');
                }
            } else {
                console.log('❌ Response is not a valid MPD manifest');
                console.log('First 200 chars:', text.substring(0, 200));
            }
        } else if (response.status === 401) {
            console.log('❌ Authentication failed');
        } else if (response.status === 403) {
            console.log('❌ Access forbidden (user might be inactive)');
        } else if (response.status >= 300 && response.status < 400) {
            console.log('⚠️  Redirect detected');
            const location = response.headers.get('location');
            console.log(`Redirecting to: ${location}`);
        } else {
            const text = await response.text();
            console.log('Error response:', text.substring(0, 300));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testVercelProxy();
