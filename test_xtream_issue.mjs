// Test both endpoints to identify the issue
const baseUrl = 'http://localhost:3000';

async function testEndpoints() {
    console.log('=== Testing Xtream Playlist Issue ===\n');

    // Test 1: Get the Xtream playlist
    console.log('1. Testing /api/get endpoint...');
    try {
        const response = await fetch(`${baseUrl}/api/get?username=22&password=22`);
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content length:', text.length, 'bytes');

        // Parse first few lines
        const lines = text.split('\n').slice(0, 30);
        console.log('\nFirst 30 lines:');
        lines.forEach((line, i) => {
            if (line.startsWith('#EXTINF') || line.startsWith('#EXTM3U') || (!line.startsWith('#') && line.trim())) {
                console.log(`Line ${i + 1}:`, line.substring(0, 100));
            }
        });

        // Extract first stream URL
        const streamUrlMatch = text.match(/http[^\s\n]+/);
        if (streamUrlMatch) {
            const firstStreamUrl = streamUrlMatch[0];
            console.log('\nFirst stream URL found:', firstStreamUrl);

            // Test 2: Try to access the stream URL
            console.log('\n2. Testing first stream URL...');
            try {
                const streamResponse = await fetch(firstStreamUrl, {
                    redirect: 'manual'  // Don't follow redirects
                });
                console.log('Stream URL status:', streamResponse.status);
                console.log('Stream URL headers:', Object.fromEntries(streamResponse.headers.entries()));

                if (streamResponse.status === 302 || streamResponse.status === 307) {
                    console.log('Redirect location:', streamResponse.headers.get('location'));
                }

                // Try to read a bit of the response
                const responseText = await streamResponse.text();
                console.log('Response preview:', responseText.substring(0, 200));

            } catch (streamError) {
                console.error('Stream URL error:', streamError.message);
            }
        } else {
            console.log('No stream URLs found in playlist!');
        }

    } catch (error) {
        console.error('Playlist error:', error.message);
    }

    // Test 3: Compare with working JTV playlist
    console.log('\n3. Testing /jtv.m3u endpoint (working)...');
    try {
        const response = await fetch(`${baseUrl}/jtv.m3u`);
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Content length:', text.length, 'bytes');

        // Extract first stream URL
        const streamUrlMatch = text.match(/https?:\/\/[^\s\n]+\.mpd[^\s\n]*/);
        if (streamUrlMatch) {
            console.log('First JTV stream URL:', streamUrlMatch[0].substring(0, 100));
        }

    } catch (error) {
        console.error('JTV error:', error.message);
    }
}

testEndpoints().catch(console.error);
