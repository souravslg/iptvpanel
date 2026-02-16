// Simple async test
const https = require('https');

function testSync() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/sync-playlist',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer dev-secret-key'
        }
    };

    console.log('Testing sync endpoint...\n');

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Response:', data);

            try {
                const json = JSON.parse(data);
                console.log('\n✅ Success:', json);
            } catch (e) {
                console.log('\n⚠️ Response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Error:', e.message);
    });

    req.end();
}

testSync();
