async function checkDRMConfig() {
    console.log('=== Checking DRM/Token Configuration ===\n');

    // Fetch player_api response
    console.log('1. Fetching player_api response...');
    const response = await fetch('http://localhost:3000/api/player_api?username=22&password=22&action=get_live_streams');
    const streams = await response.json();

    if (!streams || streams.length === 0) {
        console.log('❌ No streams returned');
        return;
    }

    // Check first few streams
    console.log(`\n2. Checking DRM configuration for sample streams:\n`);

    for (let i = 0; i < Math.min(3, streams.length); i++) {
        const stream = streams[i];
        console.log(`Stream ${i + 1}: ${stream.name}`);
        console.log(`  Stream ID: ${stream.stream_id}`);
        console.log(`  Direct Source: ${stream.direct_source}`);
        console.log(`  DRM Scheme: ${stream.drm_scheme || 'none'}`);
        console.log(`  DRM License URL: ${stream.drm_license_url || 'none'}`);

        // Check if DRM license URL has proper format
        if (stream.drm_license_url) {
            console.log(`\n  Analyzing DRM License URL:`);
            const licenseUrl = stream.drm_license_url;

            // Check for key ID and key
            if (licenseUrl.includes('keyid=') && licenseUrl.includes('&')) {
                const parts = licenseUrl.split('keyid=')[1];
                const keyidPart = parts.split('|')[0];
                console.log(`  ✅ Contains keyid parameter: ${keyidPart.substring(0, 30)}...`);

                // Check for User-Agent
                if (licenseUrl.includes('User-Agent=')) {
                    console.log(`  ✅ Contains User-Agent directive`);
                } else {
                    console.log(`  ⚠️ Missing User-Agent directive`);
                }
            } else {
                console.log(`  ⚠️ License URL format may be incorrect`);
            }
        } else {
            console.log(`  ℹ️ No DRM (public stream)`);
        }
        console.log('');
    }

    // Check redirect URL for one stream
    console.log('\n3. Testing actual redirect URL...');
    const testStream = streams[0];
    const redirectUrl = `http://localhost:3000/live/22/22/${testStream.stream_id}.ts`;
    console.log(`  Request URL: ${redirectUrl}`);

    const redirectResponse = await fetch(redirectUrl, { redirect: 'manual' });
    console.log(`  Status: ${redirectResponse.status}`);

    if (redirectResponse.status === 302) {
        const location = redirectResponse.headers.get('location');
        console.log(`  Redirect to: ${location}`);

        // Check if the redirect URL contains tokens
        if (location && location.includes('hdnts=')) {
            console.log(`  ✅ URL contains token (hdnts=...)`);
        } else {
            console.log(`  ⚠️ URL may be missing authentication token`);
        }
    }

    console.log('\n=== DRM Configuration Summary ===');
    const drmStreams = streams.filter(s => s.drm_scheme).length;
    console.log(`Total Streams: ${streams.length}`);
    console.log(`DRM Protected: ${drmStreams}`);
    console.log(`Public Streams: ${streams.length - drmStreams}`);

    console.log('\nFor OTT Navigator to work with DRM:');
    console.log('  1. Player must support clearkey DRM');
    console.log('  2. DRM license URL must be properly formatted');
    console.log('  3. Redirect URL must contain valid tokens');
}

checkDRMConfig().catch(console.error);
