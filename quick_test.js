// Quick test to verify the fix is working

async function quickTest() {
    const baseUrl = 'http://localhost:3000'; // Your dev server
    const username = 'home2';
    const password = 'home2';

    console.log('=== Testing Xtream API Fix ===\n');
    console.log('Fetching stream list...\n');

    const url = `${baseUrl}/api/player_api?username=${username}&password=${password}&action=get_live_streams`;

    try {
        const response = await fetch(url);
        const streams = await response.json();

        // Check a few JioTV streams
        const jioStreams = streams.filter(s =>
            s.name.includes('Colors HD') ||
            s.name.includes('Zee TV') ||
            s.name.includes('Star Sports')
        ).slice(0, 5);

        console.log(`Found ${jioStreams.length} test streams:\n`);

        let allUsingProxy = true;

        for (const stream of jioStreams) {
            const isProxy = stream.direct_source.includes('/live/');
            const status = isProxy ? '✅ PROXY' : '❌ DIRECT';

            console.log(`${status} - ${stream.name}`);
            console.log(`   URL: ${stream.direct_source.substring(0, 60)}...`);

            if (!isProxy) allUsingProxy = false;
        }

        console.log('\n' + '='.repeat(50));
        if (allUsingProxy) {
            console.log('✅ SUCCESS! All JioTV streams are using proxy mode.');
            console.log('\nNext step: Test playback in TiviMate');
            console.log('If TiviMate is on another device, use your PC\'s IP:');
            console.log('Run: ipconfig');
            console.log('Look for "IPv4 Address" under your active network adapter');
            console.log('Use: http://YOUR_IP:3000 in TiviMate\'s Xtream URL');
        } else {
            console.log('⚠️  WARNING: Some streams are still using direct mode!');
            console.log('The fix may not be working correctly.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nMake sure:');
        console.log('1. Dev server is running (npm run dev)');
        console.log('2. Server is accessible at http://localhost:3000');
    }
}

quickTest();
