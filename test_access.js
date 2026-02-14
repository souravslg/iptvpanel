const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAccess() {
    console.log('=== Testing Stream Access ===\n');

    // Get a sample stream
    const { data: streams } = await supabase
        .from('streams')
        .select('name, url')
        .eq('playlist_id', 30)
        .limit(1);

    if (!streams || streams.length === 0) {
        console.log('❌ No streams found');
        return;
    }

    const stream = streams[0];
    console.log(`Stream: ${stream.name}`);
    console.log(`URL: ${stream.url}\n`);

    // Test 1: Direct Access (No Headers)
    console.log('Test 1: Direct Access (No Headers)');
    try {
        const r1 = await fetch(stream.url);
        console.log(`Status: ${r1.status} ${r1.statusText}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    // Test 2: With User-Agent
    console.log('\nTest 2: With User-Agent');
    try {
        const r2 = await fetch(stream.url, {
            headers: {
                'User-Agent': 'plaYtv/7.1.3 (Linux;Android 13) ygx/824.1 ExoPlayerLib/2.4.0'
            }
        });
        console.log(`Status: ${r2.status} ${r2.statusText}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    // Test 3: With Referer
    console.log('\nTest 3: With Referer');
    try {
        const r3 = await fetch(stream.url, {
            headers: {
                'Referer': 'https://jiotv.com/'
            }
        });
        console.log(`Status: ${r3.status} ${r3.statusText}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testAccess().catch(console.error);
