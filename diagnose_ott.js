const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseIssue() {
    console.log('=== Diagnosing OTT Navigator Issue ===\n');

    // 1. Check stream mode setting
    console.log('1. Checking stream mode...');
    const { data: modeData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();

    const streamMode = modeData?.value || 'proxy';
    console.log(`   Stream Mode: ${streamMode}`);
    console.log(`   This determines if streams are proxied or redirected\n`);

    // 2. Get a sample stream and check its headers
    console.log('2. Checking sample stream configuration...');
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name, url, headers')
        .in('playlist_id', [30])
        .limit(1);

    if (streams && streams.length > 0) {
        const stream = streams[0];
        console.log(`   Stream: ${stream.name}`);
        console.log(`   ID: ${stream.stream_id}`);

        let headers = {};
        if (stream.headers) {
            try {
                headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            } catch (e) { }
        }

        const hasCookies = Object.keys(headers).some(key => key.toLowerCase() === 'cookie');
        console.log(`   Has Cookie headers: ${hasCookies}`);

        if (hasCookies) {
            console.log(`   → Smart Proxy will FORCE PROXY mode (even if stream_mode='direct')`);
        } else {
            console.log(`   → Smart Proxy will use stream_mode setting`);
        }
        console.log('');

        // 3. Test actual response
        console.log('3. Testing actual stream response...');
        const testUrl = `http://localhost:3000/live/22/22/${stream.stream_id}.ts`;
        console.log(`   URL: ${testUrl}`);

        try {
            const response = await fetch(testUrl, {
                redirect: 'manual' // Don't follow redirects
            });

            console.log(`   Status: ${response.status}`);

            if (response.status === 302 || response.status === 307) {
                const location = response.headers.get('location');
                console.log(`   → REDIRECT to: ${location?.substring(0, 80)}...`);
                console.log(`   → OTT Navigator should follow this redirect`);
            } else if (response.status === 200) {
                const contentType = response.headers.get('content-type');
                console.log(`   → PROXY MODE (serving content directly)`);
                console.log(`   → Content-Type: ${contentType}`);
            } else {
                console.log(`   → Unexpected status!`);
            }
        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
        }
        console.log('');
    }

    // 4. Analysis
    console.log('=== ANALYSIS ===');
    console.log('Yesterday it was working → likely using PROXY mode');
    console.log('Today it\'s not working → checking what changed...\n');

    if (streamMode === 'direct') {
        console.log('⚠️ ISSUE FOUND:');
        console.log('   Stream mode is set to "direct"');
        console.log('   Smart Proxy detects cookies and forces PROXY');
        console.log('   But the proxy might not be compatible with OTT Navigator\n');
        console.log('💡 SOLUTION:');
        console.log('   Change stream_mode back to "proxy" for full compatibility');
        console.log('   OR fix the proxy to work better with OTT Navigator');
    } else {
        console.log('Stream mode is already "proxy" - need to investigate further');
    }
}

diagnoseIssue().catch(console.error);
