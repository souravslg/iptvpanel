const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStreamMode() {
    console.log('=== Fixing Stream Mode for OTT Navigator ===\n');

    // Change stream_mode to 'proxy'
    console.log('Changing stream_mode to "proxy"...');

    const { data, error } = await supabase
        .from('settings')
        .update({ value: 'proxy' })
        .eq('key', 'stream_mode')
        .select();

    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }

    console.log('✅ Stream mode changed to "proxy"\n');

    // Verify the change
    const { data: verifyData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();

    console.log(`Current stream_mode: ${verifyData?.value}\n`);

    console.log('=== What This Fixes ===');
    console.log('Before: stream_mode="direct" → Smart Proxy forced proxy for cookies');
    console.log('After:  stream_mode="proxy" → All streams consistently proxied');
    console.log('\nThis ensures OTT Navigator gets consistent behavior like yesterday.');
    console.log('\n✅ Try accessing streams in OTT Navigator now!');
}

fixStreamMode().catch(console.error);
