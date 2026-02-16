// Test the player_api to see what URLs it's actually generating

async function testPlayerAPI() {
    console.log('=== Testing Xtream Player API ===\n');

    const testUser = {
        username: 'test', // Replace with your actual test username
        password: 'test'  // Replace with your actual test password
    };

    const baseUrl = 'http://localhost:3000'; // Change if running on different port

    // Test 1: Get user info
    console.log('1. Testing authentication...');
    const authUrl = `${baseUrl}/api/player_api?username=${testUser.username}&password=${testUser.password}`;

    try {
        const authRes = await fetch(authUrl);
        const authData = await authRes.json();

        if (authData.user_info?.auth === 1) {
            console.log('✓ Authentication successful');
            console.log(`  User: ${authData.user_info.username}`);
            console.log(`  Status: ${authData.user_info.status}`);
        } else {
            console.log('✗ Authentication failed');
            console.log('  Response:', JSON.stringify(authData, null, 2));
            return;
        }
    } catch (e) {
        console.error('✗ Auth request failed:', e.message);
        console.error('  Make sure dev server is running on', baseUrl);
        return;
    }

    // Test 2: Get live streams and check URLs
    console.log('\n2. Testing get_live_streams...');
    const streamsUrl = `${baseUrl}/api/player_api?username=${testUser.username}&password=${testUser.password}&action=get_live_streams`;

    try {
        const streamsRes = await fetch(streamsUrl);
        const streams = await streamsRes.json();

        console.log(`✓ Received ${streams.length} streams`);

        // Check a few streams
        const cookieStreams = streams.filter(s =>
            s.name.includes('Colors HD') ||
            s.name.includes('Star Sports') ||
            s.name.includes('Zee')
        ).slice(0, 3);

        console.log('\n3. Checking stream URLs:');
        for (const stream of cookieStreams) {
            console.log(`\n--- ${stream.name} ---`);
            console.log(`  Stream ID: ${stream.stream_id}`);
            console.log(`  Extension: ${stream.container_extension}`);
            console.log(`  Direct Source: ${stream.direct_source}`);

            // Check if it's using proxy or direct
            if (stream.direct_source.includes('/live/')) {
                console.log('  ✓ Using PROXY mode');
            } else if (stream.direct_source.includes('jiotv')) {
                console.log('  ✗ Using DIRECT mode (this might fail!)');
            }
        }

        // Show all URL patterns
        console.log('\n4. URL pattern analysis:');
        const proxyCount = streams.filter(s => s.direct_source.includes('/live/')).length;
        const directCount = streams.filter(s => !s.direct_source.includes('/live/')).length;

        console.log(`  Proxy URLs: ${proxyCount}`);
        console.log(`  Direct URLs: ${directCount}`);

        if (directCount > 0) {
            console.log('\n  ⚠️  WARNING: Some streams are using direct URLs!');
            console.log('  This means the forceProxyForCookies logic might not be working.');
        } else {
            console.log('\n  ✓ All streams are using proxy mode!');
        }

    } catch (e) {
        console.error('✗ Streams request failed:', e.message);
    }
}

// Run the test
testPlayerAPI().then(() => {
    console.log('\n=== Test Complete ===');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
