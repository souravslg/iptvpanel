const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStream() {
    console.log('=== Testing Stream Access ===\n');

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
    console.log(`Sample Stream: ${stream.name}`);
    console.log(`Stream ID: ${stream.stream_id}`);
    console.log(`Source URL: ${stream.url}`);

    const testUrl = `http://localhost:3000/live/22/22/${stream.stream_id}.ts`;
    console.log(`\nTest URL: ${testUrl}`);
    console.log('\nTesting access...');

    try {
        const response = await fetch(testUrl);
        console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
        console.log(`Response Headers:`, {
            'content-type': response.headers.get('content-type'),
            'location': response.headers.get('location')
        });

        if (response.status === 404) {
            const text = await response.text();
            console.log(`\n404 Error Message: ${text}`);
        }
    } catch (err) {
        console.log(`\n❌ Fetch Error: ${err.message}`);
    }
}

testStream().catch(console.error);
