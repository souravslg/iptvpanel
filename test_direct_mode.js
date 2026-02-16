// Test direct mode output

async function testDirectMode() {
    console.log('=== Testing Direct Mode Output ===\n');

    // Test Xtream API
    const xtreamUrl = 'http://localhost:3000/api/player_api?username=home2&password=home2&action=get_live_streams';

    try {
        const response = await fetch(xtreamUrl);
        const streams = await response.json();

        const jioStream = streams.find(s => s.name.includes('Colors HD'));

        if (jioStream) {
            console.log('Xtream API Output (Colors HD):');
            console.log('---');
            console.log('Stream ID:', jioStream.stream_id);
            console.log('Name:', jioStream.name);
            console.log('Extension:', jioStream.container_extension);
            console.log('Direct Source:', jioStream.direct_source?.substring(0, 120) + '...');
            console.log('---\n');

            if (jioStream.direct_source?.includes('jiotv')) {
                console.log('✅ Using DIRECT URL');
                if (jioStream.direct_source.includes('|')) {
                    console.log('✅ Has pipe headers');
                    if (jioStream.direct_source.includes('Cookie=')) {
                        console.log('✅ Cookie included in pipe headers');
                    }
                } else {
                    console.log('⚠️  No pipe headers found');
                }
            } else if (jioStream.direct_source?.includes('/live/')) {
                console.log('❌ Still using PROXY URL');
            }
        }

        // Test M3U export
        console.log('\nTesting M3U Export:');
        const m3uUrl = 'http://localhost:3000/api/get?username=shiv&password=shiv1';
        const m3uResponse = await fetch(m3uUrl);
        const m3u = await m3uResponse.text();

        const lines = m3u.split('\n');
        const colorsIndex = lines.findIndex(l => l.includes('Colors HD'));

        if (colorsIndex > -1) {
            const urlLine = lines[colorsIndex + 1];
            console.log('M3U URL:', urlLine?.substring(0, 120) + '...');

            if (urlLine?.includes('jiotv')) {
                console.log('✅ M3U uses DIRECT URL');
                if (urlLine?.includes('|')) {
                    console.log('✅ Has pipe headers in M3U');
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDirectMode();
