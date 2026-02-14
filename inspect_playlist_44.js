const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

const PLAYLIST_ID = 44;

async function fetchDrmStreams() {
    // 2. Fetch specific streams with DRM
    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', PLAYLIST_ID)
        .not('drm_scheme', 'is', null) // Only get streams WITH drm_scheme
        .limit(3);

    if (error) {
        console.error('Error:', error);
    } else {
        streams.forEach(s => {
            console.log('\n--- Stream JSON ---');
            console.log(JSON.stringify(s, null, 2));
        });
    }
}

fetchDrmStreams().catch(console.error);
