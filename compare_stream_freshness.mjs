// Check if JTV playlist streams work vs Xtream playlist streams
const baseUrl = 'http://localhost:3000';

async function compareStreamFreshness() {
    console.log('=== Comparing Stream URL Freshness ===\n');

    // Test 1: Check JTV playlist stream
    console.log('1. Testing JTV playlist stream...');
    try {
        const jtvRes = await fetch(`${baseUrl}/jtv.m3u`);
        const jtvText = await jtvRes.text();

        if (jtvRes.status !== 200) {
            console.log(`   ❌ JTV playlist error: ${jtvRes.status}\n`);
        } else {
            // Extract first stream URL
            const lines = jtvText.split('\n');
            let firstUrl = null;
            for (const line of lines) {
                if (line.trim() && !line.startsWith('#') && line.includes('http')) {
                    firstUrl = line.trim();
                    break;
                }
            }

            if (firstUrl) {
                console.log(`   URL: ${firstUrl.substring(0, 100)}...`);

                // Test if it works
                const testRes = await fetch(firstUrl, { method: 'HEAD', redirect: 'manual' });
                console.log(`   Status: ${testRes.status}`);

                if (testRes.status === 200 || testRes.status === 302 || testRes.status === 307) {
                    console.log('   ✅ JTV stream is accessible\n');
                } else {
                    console.log(`   ❌ JTV stream returns ${testRes.status}\n`);
                }
            }
        }
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
    }

    // Test 2: Check Xtream playlist stream (via proxy)
    console.log('2. Testing Xtream playlist stream (via proxy)...');
    const proxyUrl = `${baseUrl}/live/22/22/1002.ts`;

    try {
        const proxyRes = await fetch(proxyUrl, { redirect: 'manual' });
        console.log(`   Status: ${proxyRes.status}`);

        if (proxyRes.status === 302 || proxyRes.status === 307) {
            const targetUrl = proxyRes.headers.get('location');
            console.log(`   Redirects to: ${targetUrl?.substring(0, 100)}...`);

            // Test target URL
            const targetRes = await fetch(targetUrl, { method: 'HEAD', redirect: 'manual' });
            console.log(`   Target status: ${targetRes.status}`);

            if (targetRes.status === 200 || targetRes.status === 302) {
                console.log('   ✅ Xtream stream is accessible\n');
            } else {
                console.log('   ❌ Xtream stream target returns 404 - URLS ARE STALE!\n');
            }
        }
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
    }

    console.log('=== CONCLUSION ===');
    console.log('If JTV streams work but Xtream streams return 404:');
    console.log('→ The Xtream playlist URLs in the database are outdated');
    console.log('→ Need to refresh the stream URLs from the source');
    console.log('→ This is NOT a proxy vs direct URL issue!');
}

compareStreamFreshness().catch(console.error);
