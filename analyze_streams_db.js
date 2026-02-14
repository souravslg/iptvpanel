const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

const PLAYLIST_ID = 44;

async function analyze() {
    console.log('--- Analysis of Playlist 44 ---');

    // 1. Total Streams
    const { count: total } = await supabase
        .from('streams')
        .select('id', { count: 'exact', head: true })
        .eq('playlist_id', PLAYLIST_ID);
    console.log(`Total Streams: ${total}`);

    // 2. Streams with Clearkey Scheme
    const { count: clearkeyCount, error: err1 } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', PLAYLIST_ID)
        .eq('drm_scheme', 'clearkey');
    console.log(`Streams with DRM Scheme 'clearkey': ${clearkeyCount} (Error: ${err1})`);

    // 3. Streams with Clearkey AND Key ID
    const { count: keysCount, error: err2 } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', PLAYLIST_ID)
        .eq('drm_scheme', 'clearkey')
        .not('drm_key_id', 'is', null);
    console.log(`Streams with 'clearkey' AND populated keys: ${keysCount} (Error: ${err2})`);

    // 4. Missing Keys
    console.log(`Potential Broken Streams (Clearkey but no keys): ${clearkeyCount - keysCount}`);

    // 5. Inspect "Star Sports 1 HD" (Working)
    const { data: working } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', PLAYLIST_ID)
        .ilike('name', '%Star Sports 1 HD%')
        .limit(1);

    if (working && working.length > 0) {
        console.log('\n--- Working Channel (Reference) ---');
        console.log(JSON.stringify({
            name: working[0].name,
            drm_scheme: working[0].drm_scheme,
            has_key: !!working[0].drm_key,
            key_len: working[0].drm_key ? working[0].drm_key.length : 0
        }, null, 2));
    } else {
        console.log('\nCould not find "Star Sports 1 HD" in DB');
    }

    // 6. Inspect Sample Broken Stream (if any)
    if (clearkeyCount - keysCount > 0) {
        const { data: broken } = await supabase
            .from('streams')
            .select('*')
            .eq('playlist_id', PLAYLIST_ID)
            .eq('drm_scheme', 'clearkey')
            .is('drm_key', null)
            .limit(3);

        console.log('\n--- Sample Broken Streams (Missing Keys) ---');
        broken.forEach(s => console.log(`- ${s.name} (URL: ${s.url.substring(0, 50)}...)`));
    }
}

analyze().catch(console.error);
