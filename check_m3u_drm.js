// Check if M3U export has correct DRM keys for Colors HD

async function checkM3UKeys() {
    const url = 'http://localhost:3000/api/get?username=shiv&password=shiv1';

    console.log('=== Checking M3U DRM Keys ===\n');

    const response = await fetch(url);
    const m3u = await response.text();

    // Find Colors HD section
    const lines = m3u.split('\n');
    const colorsIndex = lines.findIndex(l => l.includes('Colors HD'));

    if (colorsIndex > -1) {
        console.log('Colors HD M3U Entry:');
        console.log('---');
        for (let i = Math.max(0, colorsIndex - 8); i < Math.min(lines.length, colorsIndex + 2); i++) {
            console.log(lines[i]);
        }
        console.log('---\n');

        // Check for clearkey license
        const hasClearkey = lines.slice(Math.max(0, colorsIndex - 8), colorsIndex).some(l =>
            l.includes('clearkey') || l.includes('org.w3.clearkey')
        );

        const hasLicenseKey = lines.slice(Math.max(0, colorsIndex - 8), colorsIndex).some(l =>
            l.includes('license_key=') && l.includes(':')
        );

        console.log('Has Clearkey scheme:', hasClearkey ? 'YES ✅' : 'NO ❌');
        console.log('Has License key (kid:key format):', hasLicenseKey ? 'YES ✅' : 'NO ❌');

        if (!hasLicenseKey) {
            console.log('\n❌ PROBLEM: No license key found!');
            console.log('TiviMate needs the license key to decrypt the stream.');
        }
    }
}

checkM3UKeys();
