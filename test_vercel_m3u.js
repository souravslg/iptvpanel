// Test Vercel M3U export to see what URLs are being generated

async function testVercelM3U() {
    const vercelUrl = 'https://admin.iptvindia.co.in';
    const username = 'shiv';
    const password = 'shiv1';

    console.log('=== Testing Vercel M3U Export ===\n');

    const url = `${vercelUrl}/api/get?username=${username}&password=${password}`;
    console.log('Fetching:', url);

    try {
        const response = await fetch(url);
        const m3u = await response.text();

        console.log(`M3U length: ${m3u.length} bytes\n`);

        // Find Colors HD entry
        const lines = m3u.split('\n');
        const colorsIndex = lines.findIndex(l => l.includes('Colors HD'));

        if (colorsIndex > -1) {
            console.log('Colors HD entry:');
            console.log('---');
            for (let i = Math.max(0, colorsIndex - 5); i < Math.min(lines.length, colorsIndex + 3); i++) {
                console.log(lines[i]);
            }
            console.log('---\n');

            // Check what the URL looks like
            const urlLine = lines[colorsIndex + 1];
            if (urlLine) {
                if (urlLine.includes('localhost')) {
                    console.log('❌ PROBLEM: URL uses "localhost"');
                    console.log('TiviMate on TV/phone cannot access localhost!');
                } else if (urlLine.includes('admin.iptvindia.co.in')) {
                    console.log('✅ URL uses correct domain');
                } else if (urlLine.includes('jiotv')) {
                    console.log('❌ PROBLEM: Still using direct JioTV URL, not proxy!');
                }
            }
        }

        // Check if EXTHTTP is present
        const hasEXTHTTP = m3u.includes('#EXTHTTP');
        console.log(`Has EXTHTTP tags: ${hasEXTHTTP ? 'YES ✅' : 'NO ❌'}`);

        // Count localhost vs proper domain
        const localhostCount = (m3u.match(/localhost/g) || []).length;
        const domainCount = (m3u.match(/admin\.iptvindia\.co\.in/g) || []).length;

        console.log(`\nURL Analysis:`);
        console.log(`Localhost URLs: ${localhostCount}`);
        console.log(`Domain URLs: ${domainCount}`);

        if (localhostCount > 0) {
            console.log('\n⚠️  WARNING: M3U contains localhost URLs!');
            console.log('These will not work from TiviMate on another device.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testVercelM3U();
