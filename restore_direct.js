const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreDirectMode() {
    console.log('=== Restoring Direct URL Mode ===\n');

    // Change stream_mode back to 'direct'
    console.log('Changing stream_mode to "direct" (redirect mode)...');

    const { error } = await supabase
        .from('settings')
        .update({ value: 'direct' })
        .eq('key', 'stream_mode');

    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }

    console.log('✅ Stream mode changed to "direct"\n');

    // Verify
    const { data: verifyData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();

    console.log(`Current stream_mode: ${verifyData?.value}\n`);

    // Test redirect behavior
    console.log('Testing redirect behavior...');
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name, url')
        .in('playlist_id', [30])
        .limit(1);

    if (streams && streams.length > 0) {
        const testUrl = `http://localhost:3000/live/22/22/${streams[0].stream_id}.ts`;
        console.log(`Test URL: ${testUrl}\n`);

        const response = await fetch(testUrl, { redirect: 'manual' });
        console.log(`Response Status: ${response.status}`);

        if (response.status === 302) {
            const location = response.headers.get('location');
            console.log(`✅ REDIRECT to: ${location?.substring(0, 100)}...`);
            console.log('\nOTT Navigator will now access the source URL directly!');
            console.log('This is how it was working before. Try it now!');
        } else {
            console.log(`⚠️ Status ${response.status} - expected 302 redirect`);
        }
    }
}

restoreDirectMode().catch(console.error);
