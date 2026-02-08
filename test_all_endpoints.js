const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllEndpoints() {
    console.log('=== TESTING ALL API ENDPOINTS ===\n');

    // Get a valid user
    const { data: users } = await supabase
        .from('users')
        .select('username, password')
        .eq('status', 'Active')
        .limit(1);

    const user = users[0];
    console.log(`Testing with user: ${user.username} / ${user.password}\n`);

    // Test 1: Xtream API (player_api)
    console.log('1. Testing Xtream API (player_api):');
    const xtreamUrl = `https://iptvpanel.vercel.app/api/player_api?username=${user.username}&password=${user.password}&action=get_live_streams`;
    try {
        const response = await fetch(xtreamUrl);
        const data = await response.json();
        console.log(`   ✅ Returns: ${data.length} channels`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 2: M3U API (get)
    console.log('\n2. Testing M3U API (get):');
    const m3uUrl = `https://iptvpanel.vercel.app/api/get?username=${user.username}&password=${user.password}`;
    try {
        const response = await fetch(m3uUrl);
        const m3uContent = await response.text();
        const channelCount = (m3uContent.match(/#EXTINF/g) || []).length;
        console.log(`   ✅ Returns: ${channelCount} channels in M3U format`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 3: Playlist API (internal)
    console.log('\n3. Testing Internal Playlist API:');
    const playlistUrl = `https://iptvpanel.vercel.app/api/playlist`;
    try {
        const response = await fetch(playlistUrl);
        const data = await response.json();
        console.log(`   ✅ Total channels: ${data.totalChannels}`);
        console.log(`   ✅ Active playlists: ${data.activePlaylists?.length || 0}`);
        if (data.activePlaylists && data.activePlaylists.length > 0) {
            data.activePlaylists.forEach(p => {
                console.log(`      - ${p.name} (ID: ${p.id})`);
            });
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n=== SUMMARY ===');
    console.log('All endpoints should return 978 channels from the "jttt" playlist.');
    console.log('If OTT Navigator shows 1125 channels, it\'s using cached data.');
}

testAllEndpoints().catch(console.error);
