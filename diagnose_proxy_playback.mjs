// Test what the actual playlist looks like and test a stream
const baseUrl = 'http://localhost:3000';

async function diagnoseProxyPlayback() {
    console.log('=== Diagnosing Proxy Playback Issues ===\n');

    // Get the playlist
    console.log('1. Fetching playlist...');
    const res = await fetch(`${baseUrl}/api/get?username=22&password=22`);
    const text = await res.text();

    console.log(`Status: ${res.status}`);
    console.log(`Size: ${text.length} bytes\n`);

    // Check if it uses proxy URLs
    const hasProxyUrls = text.includes('/live/22/22/');
    const hasDirectUrls = text.includes('https://jiotv') || text.includes('https://dishmt');

    console.log(`Has proxy URLs: ${hasProxyUrls}`);
    console.log(`Has direct URLs: ${hasDirectUrls}\n`);

    // Extract first channel entry
    const lines = text.split('\n');
    let firstChannel = null;
    let firstUrl = null;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const nameMatch = lines[i].match(/tvg-name="([^"]+)"/);
            firstChannel = nameMatch ? nameMatch[1] : 'Unknown';

            // Find the URL (should be right after EXTINF or within a few lines)
            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                const line = lines[j].trim();
                if (line && !line.startsWith('#')) {
                    firstUrl = line;
                    break;
                }
            }
            break;
        }
    }

    if (firstChannel && firstUrl) {
        console.log('2. First channel in playlist:');
        console.log(`   Channel: ${firstChannel}`);
        console.log(`   URL: ${firstUrl}\n`);

        // Test the URL
        console.log('3. Testing stream URL...');

        try {
            const streamRes = await fetch(firstUrl, {
                redirect: 'manual',
                headers: {
                    'User-Agent': 'VLC/3.0.0'
                }
            });

            console.log(`   Status: ${streamRes.status}`);

            if (streamRes.status === 302 || streamRes.status === 307) {
                const location = streamRes.headers.get('location');
                console.log(`   ✅ Redirects to: ${location?.substring(0, 100)}...`);

                // Test if the final URL is accessible
                console.log('\n4. Testing final stream URL...');
                try {
                    const finalRes = await fetch(location, {
                        method: 'HEAD',
                        redirect: 'manual'
                    });
                    console.log(`   Final URL status: ${finalRes.status}`);

                    if (finalRes.status === 200) {
                        console.log('   ✅ Stream is accessible!');
                    } else {
                        console.log(`   ⚠️  Stream returned ${finalRes.status}`);
                    }
                } catch (err) {
                    console.log(`   ❌ Cannot access final URL: ${err.message}`);
                }
            } else if (streamRes.status === 200) {
                console.log('   ✅ Stream accessible directly');
            } else {
                const errorText = await streamRes.text();
                console.log(`   ❌ Error: ${errorText.substring(0, 200)}`);
            }
        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
        }
    }

    console.log('\n=== DIAGNOSIS ===');
    if (hasProxyUrls) {
        console.log('Playlist uses PROXY URLs');
        console.log('Issue might be:');
        console.log('1. CORS issues (proxy headers not set correctly)');
        console.log('2. Player not following redirects');
        console.log('3. Proxy authentication failing');
    } else if (hasDirectUrls) {
        console.log('Playlist uses DIRECT URLs - should work fine');
    }
}

diagnoseProxyPlayback().catch(console.error);
