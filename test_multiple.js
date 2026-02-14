const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMultiple() {
    console.log('=== Testing Multiple Streams ===\n');

    const { data: streams } = await supabase
        .from('streams')
        .select('name, url')
        .eq('playlist_id', 30)
        .limit(5);

    if (!streams) return;

    for (const stream of streams) {
        console.log(`Testing: ${stream.name}`);
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(stream.url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            clearTimeout(id);
            console.log(`  Status: ${response.status}`);
        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
        console.log('');
    }
}

testMultiple().catch(console.error);
