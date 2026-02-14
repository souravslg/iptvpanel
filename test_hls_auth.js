const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHlsWithCookie() {
    console.log('=== Testing HLS with Cookie ===\n');

    // Get a stream with headers
    const { data: streams } = await supabase
        .from('streams')
        .select('name, url, headers')
        .eq('playlist_id', 30)
        .not('headers', 'is', null)
        .limit(1);

    if (!streams || streams.length === 0) {
        console.log('❌ No streams with headers found');
        return;
    }

    const stream = streams[0];
    const mpdUrl = stream.url;
    // Construct HLS URL
    const hlsUrl = mpdUrl.replace('.mpd', '.m3u8');

    console.log(`Stream: ${stream.name}`);
    console.log(`MPD: ${mpdUrl}`);
    console.log(`HLS: ${hlsUrl}`);
    console.log(`Headers:`, stream.headers);

    // Prepare headers
    const headers = { ...stream.headers };
    // User-Agent might be critical
    if (!headers['User-Agent']) headers['User-Agent'] = 'Mozilla/5.0';

    try {
        const response = await fetch(hlsUrl, { headers });
        console.log(`\nHLS Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            console.log('✅ HLS is accessible with same cookie!');
        } else {
            console.log('❌ HLS access failed (might not exist or needs different token)');
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testHlsWithCookie().catch(console.error);
