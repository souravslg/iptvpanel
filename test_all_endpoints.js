const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllEndpoints() {
    console.log('=== Testing All Endpoints ===\n');

    // Test 1: Player API - get_live_streams
    console.log('1. Testing Player API (get_live_streams)...');
    try {
        const r1 = await fetch('http://localhost:3000/api/player_api?username=22&password=22&action=get_live_streams');
        console.log(`   Status: ${r1.status}`);
        const data = await r1.json();
        console.log(`   Streams returned: ${Array.isArray(data) ? data.length : 'N/A'}`);
        if (Array.isArray(data) && data.length > 0) {
            console.log(`   Sample stream: ${data[0].name} (ID: ${data[0].stream_id})`);
        }
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
    }
    console.log('');

    // Test 2: M3U Endpoint
    console.log('2. Testing M3U Endpoint...');
    try {
        const r2 = await fetch('http://localhost:3000/api/get?username=22&password=22');
        console.log(`   Status: ${r2.status}`);
        const m3u = await r2.text();
        const lines = m3u.split('\n').filter(l => l.trim());
        console.log(`   Total lines: ${lines.length}`);
        const channelCount = lines.filter(l => l.startsWith('#EXTINF:')).length;
        console.log(`   Channels: ${channelCount}`);
    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
    }
    console.log('');

    // Test 3: Live Stream Endpoint
    console.log('3. Testing Live Stream Endpoint...');
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name')
        .in('playlist_id', [30])
        .limit(1);

    if (streams && streams.length > 0) {
        const testStreamId = streams[0].stream_id;
        try {
            const r3 = await fetch(`http://localhost:3000/live/22/22/${testStreamId}.ts`);
            console.log(`   URL: /live/22/22/${testStreamId}.ts`);
            console.log(`   Status: ${r3.status}`);
            console.log(`   Content-Type: ${r3.headers.get('content-type')}`);

            if (r3.status === 404) {
                const body = await r3.text();
                console.log(`   404 Message: ${body}`);
            } else if (r3.status === 302) {
                console.log(`   Redirect to: ${r3.headers.get('location')}`);
            }
        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
        }
    }
    console.log('');

    // Test 4: Check stream mode
    const { data: modeData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();
    console.log(`4. Stream Mode: ${modeData?.value || 'proxy'}`);
    console.log('');

    console.log('=== Summary ===');
    console.log('All critical endpoints tested above.');
    console.log('If you see a 404, the error message will show which endpoint failed.');
}

testAllEndpoints().catch(console.error);
