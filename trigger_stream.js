const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerStreamAndCheck() {
    console.log('=== Triggering Stream Request ===\n');

    // Get a sample stream
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name, url')
        .in('playlist_id', [30])
        .limit(1);

    if (!streams || streams.length === 0) {
        console.log('❌ No streams found');
        return;
    }

    const stream = streams[0];
    const testUrl = `http://localhost:3000/live/22/22/${stream.stream_id}.ts`;

    console.log(`Testing stream: ${stream.name}`);
    console.log(`URL: ${testUrl}\n`);

    console.log('Making request (check server console for logs)...\n');

    try {
        const response = await fetch(testUrl);
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Headers:`);
        console.log(`  Content-Type: ${response.headers.get('content-type')}`);
        console.log(`  Content-Length: ${response.headers.get('content-length')}`);

        if (response.status !== 200) {
            const text = await response.text();
            console.log(`\nError Body: ${text.substring(0, 200)}`);
        } else {
            console.log(`\n✅ Stream request successful`);
        }

        console.log('\n=== NOW CHECK THE SERVER LOGS ===');
        console.log('Look for lines starting with:');
        console.log('  - "--- Smart Stream Proxy Start ---"');
        console.log('  - "Smart Proxy Error:"');
        console.log('  - "Proxy fetch failed:"');
        console.log('  - Error messages or stack traces');

    } catch (err) {
        console.log(`\n❌ Fetch Error: ${err.message}`);
        console.log('Check the server console for detailed error logs');
    }
}

triggerStreamAndCheck().catch(console.error);
