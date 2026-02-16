// Test Vercel deployment to see what's failing

async function testVercel() {
    // Replace with your actual Vercel URL
    const vercelUrl = 'https://YOUR_VERCEL_URL.vercel.app'; // UPDATE THIS!
    const username = 'home2';
    const password = 'home2';

    console.log('=== Testing Vercel Deployment ===\n');
    console.log('Vercel URL:', vercelUrl);
    console.log('');

    // Test 1: Can we reach the API?
    console.log('1. Testing API authentication...');
    const authUrl = `${vercelUrl}/api/player_api?username=${username}&password=${password}`;

    try {
        const authRes = await fetch(authUrl);
        const authData = await authRes.json();

        if (authData.user_info?.auth === 1) {
            console.log('✅ Authentication successful');
        } else {
            console.log('❌ Authentication failed');
            console.log('Response:', JSON.stringify(authData, null, 2));
            return;
        }
    } catch (e) {
        console.log('❌ Cannot reach Vercel API');
        console.log('Error:', e.message);
        console.log('\nPossible issues:');
        console.log('- Vercel URL is incorrect');
        console.log('- Deployment failed');
        console.log('- Environment variables not set on Vercel');
        return;
    }

    // Test 2: Get streams
    console.log('\n2. Testing get_live_streams...');
    const streamsUrl = `${vercelUrl}/api/player_api?username=${username}&password=${password}&action=get_live_streams`;

    try {
        const streamsRes = await fetch(streamsUrl);
        const streams = await streamsRes.json();

        console.log(`✅ Received ${streams.length} streams`);

        // Check a few JioTV streams
        const jioStreams = streams.filter(s =>
            s.name.includes('Colors HD') ||
            s.name.includes('Zee TV')
        ).slice(0, 3);

        console.log('\n3. Checking stream URLs:');
        for (const stream of jioStreams) {
            const isProxy = stream.direct_source.includes('/live/');
            const status = isProxy ? '✅ PROXY' : '❌ DIRECT';

            console.log(`${status} - ${stream.name}`);
            console.log(`   URL: ${stream.direct_source.substring(0, 70)}...`);
        }

        // Test 4: Try to access a proxy URL
        if (jioStreams.length > 0 && jioStreams[0].direct_source.includes('/live/')) {
            console.log('\n4. Testing proxy endpoint...');
            const proxyUrl = jioStreams[0].direct_source;
            console.log('Testing:', proxyUrl.substring(0, 70) + '...');

            try {
                const proxyRes = await fetch(proxyUrl);
                console.log(`Status: ${proxyRes.status} ${proxyRes.statusText}`);

                if (proxyRes.ok) {
                    const contentType = proxyRes.headers.get('content-type');
                    console.log(`✅ Proxy working! Content-Type: ${contentType}`);
                } else {
                    const errorText = await proxyRes.text();
                    console.log('❌ Proxy returned error:', errorText.substring(0, 200));
                }
            } catch (e) {
                console.log('❌ Proxy fetch failed:', e.message);
            }
        }

    } catch (e) {
        console.log('❌ Failed to get streams');
        console.log('Error:', e.message);
    }
}

testVercel();
