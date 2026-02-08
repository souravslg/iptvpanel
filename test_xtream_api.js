const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testXtreamAPI() {
    console.log('=== TESTING XTREAM API ===\n');

    // Get a test user
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('username, password, status, expire_date')
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('No users found or error:', userError);
        return;
    }

    const user = users[0];
    console.log(`Testing with user: ${user.username}`);
    console.log(`Status: ${user.status}`);
    console.log(`Expire date: ${user.expire_date}\n`);

    // Simulate the Xtream API call
    const { data: activePlaylists, error: playlistError } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('is_active', true);

    if (playlistError) {
        console.error('Error fetching active playlists:', playlistError);
        return;
    }

    console.log(`Active playlists found: ${activePlaylists?.length || 0}`);
    if (activePlaylists && activePlaylists.length > 0) {
        activePlaylists.forEach(p => console.log(`  - ${p.name} (ID: ${p.id})`));
    }

    if (!activePlaylists || activePlaylists.length === 0) {
        console.log('\n⚠️  NO ACTIVE PLAYLISTS - Users will see empty playlist!');
        return;
    }

    const playlistIds = activePlaylists.map(p => p.id);
    console.log(`\nFetching streams from playlist IDs: ${playlistIds.join(', ')}`);

    // Fetch streams from active playlists
    const { data: streams, error: streamError, count } = await supabase
        .from('streams')
        .select('*', { count: 'exact' })
        .in('playlist_id', playlistIds)
        .limit(10);

    if (streamError) {
        console.error('Error fetching streams:', streamError);
        return;
    }

    console.log(`\nTotal streams that will be returned: ${count || 0}`);
    console.log(`\nSample streams (first 10):`);
    streams?.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.name} (Playlist ID: ${s.playlist_id})`);
    });

    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log(`Users should see ${count || 0} channels from playlist: ${activePlaylists.map(p => p.name).join(', ')}`);
}

testXtreamAPI().catch(console.error);
