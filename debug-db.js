const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials from verify_supabase.js (known working)
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
    console.log('--- Checking Playlists ---');

    // 1. Check all playlists
    const { data: playlists, error } = await supabase
        .from('playlists')
        .select('*');

    if (error) {
        console.error('Error fetching playlists:', error);
        return;
    }

    // console.table(playlists);

    if (playlists.length === 0) {
        console.log('No playlists found.');
    } else {
        console.log(`Found ${playlists.length} playlists.`);
    }

    // 2. Check stream counts for each playlist
    for (const p of playlists) {
        if (p.name !== 'JTV Auto-Gen') continue;

        // Count streams
        const { count, error: countError } = await supabase
            .from('streams')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', p.id);

        console.log(`--------------------------------------------------`);
        console.log(`Playlist: "${p.name}"`);
        console.log(`  - ID: ${p.id}`);
        console.log(`  - Is Active: ${p.is_active}`);
        console.log(`  - DB Stream Count(actual): ${count}`);
        console.log(`  - Meta Total Channels: ${p.total_channels}`);

        // 3. Sample check for JTV content
        if (p.name === 'JTV Auto-Gen') {
            const { data: sample } = await supabase
                .from('streams')
                .select('name, url')
                .eq('playlist_id', p.id)
                .limit(3);
            console.log('  - Sample Streams:', sample);
        }
    }
}

checkDB();
