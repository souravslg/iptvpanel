const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImport() {
    console.log('=== Verifying Import ===\n');

    // 1. Check DB Sample
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name, url, category')
        .eq('playlist_id', 30)
        .limit(3);

    console.log('Sample Streams from DB:');
    console.log(JSON.stringify(streams, null, 2));

    // 2. Check M3U Endpoint
    console.log('\nChecking M3U Endpoint...');
    try {
        const response = await fetch('http://localhost:3000/api/get?username=22&password=22');
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Content Length: ${text.length}`);
        console.log(`Line Count: ${text.split('\n').length}`);
    } catch (e) {
        console.log('❌ Error checking M3U endpoint:', e.message);
    }
}

verifyImport().catch(console.error);
