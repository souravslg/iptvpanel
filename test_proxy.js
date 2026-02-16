// Test if the proxy endpoint is working correctly

async function testProxyEndpoint() {
    console.log('=== Testing Live Proxy Endpoint ===\n');

    // Test with Colors HD (stream ID 144 from our earlier debug)
    const testCreds = {
        username: 'home2',
        password: 'home2',
        streamId: '144' // Colors HD
    };

    const baseUrl = 'http://localhost:3000';
    const proxyUrl = `${baseUrl}/live/${testCreds.username}/${testCreds.password}/${testCreds.streamId}.mpd`;

    console.log('Testing URL:', proxyUrl);
    console.log('');

    try {
        const response = await fetch(proxyUrl);

        console.log('Status:', response.status, response.statusText);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('');

        if (response.ok) {
            const text = await response.text();
            console.log('✓ Proxy is working!');
            console.log('Response preview:', text.substring(0, 200) + '...');

            // Check if it's a valid DASH manifest
            if (text.includes('MPD') || text.includes('<?xml')) {
                console.log('\n✓ Valid DASH manifest received');
            } else {
                console.log('\n⚠️  Response doesn\'t look like a DASH manifest');
            }
        } else {
            const errorText = await response.text();
            console.log('✗ Proxy returned error');
            console.log('Error:', errorText);
        }
    } catch (error) {
        console.log('✗ Failed to connect to proxy');
        console.log('Error:', error.message);
        console.log('');
        console.log('Make sure:');
        console.log('1. Dev server is running on port 3000');
        console.log('2. The credentials are correct');
        console.log('3. The stream exists in the database');
    }
}

testProxyEndpoint().catch(console.error);
