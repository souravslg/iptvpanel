// Test Vercel sync endpoint with better error handling

async function testVercelSync() {
    console.log('Testing Vercel sync endpoint...\n');

    const url = 'https://admin.iptvindia.co.in/api/sync-playlist';

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer 1234'
            }
        });

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));

        const text = await response.text();
        console.log('Response:', text.substring(0, 500));

        // Try to parse as JSON
        try {
            const json = JSON.parse(text);
            console.log('\n✅ JSON Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('\n⚠️ Not JSON, received HTML or text');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testVercelSync();
