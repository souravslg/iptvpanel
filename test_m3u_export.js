// Quick test to verify EXTHTTP is now in M3U export

async function testM3UExport() {
    const baseUrl = 'http://localhost:3000';
    const username = 'shiv';
    const password = 'shiv1';

    console.log('=== Testing M3U Export with EXTHTTP ===\n');

    const url = `${baseUrl}/api/get?username=${username}&password=${password}`;

    try {
        const response = await fetch(url);
        const m3u = await response.text();

        // Check if EXTHTTP tags are present
        const hasEXTHTTP = m3u.includes('#EXTHTTP');
        const cookieCount = (m3u.match(/#EXTHTTP/g) || []).length;

        console.log(`M3U length: ${m3u.length} bytes`);
        console.log(`Has EXTHTTP tags: ${hasEXTHTTP ? 'YES ✅' : 'NO ❌'}`);
        console.log(`Cookie count: ${cookieCount}`);

        if (hasEXTHTTP) {
            // Show first few EXTHTTP examples
            const lines = m3u.split('\\n');
            const exthttpLines = lines.filter(l => l.includes('#EXTHTTP')).slice(0, 3);

            console.log('\nSample EXTHTTP tags:');
            exthttpLines.forEach((line, i) => {
                console.log(`${i + 1}. ${line.substring(0, 80)}...`);
            });

            console.log('\n✅ FIX SUCCESSFUL! M3U now includes cookies.');
            console.log('Channels should work after refreshing playlist in TiviMate.');
        } else {
            console.log('\n❌ WARNING: No EXTHTTP tags found!');
            console.log('This means cookies are not in the M3U export.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testM3UExport();
