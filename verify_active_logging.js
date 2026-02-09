const { createClient } = require('@supabase/supabase-js');

// Hardcoded from lib/supabase.js
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('1. Setting up User...');
    const { data: user, error: userError } = await supabase.from('users').upsert({
        username: 'test_active',
        password: 'password123',
        status: 'Active',
        expire_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        max_connections: 5
    }, { onConflict: 'username' }).select().single();

    if (userError) {
        console.error('User setup failed:', userError);
        return;
    }

    console.log('2. Getting Active Stream ID...');
    // Finding an active playlist first
    let { data: playlists } = await supabase.from('playlists').select('id').eq('is_active', true).limit(1);

    if (!playlists?.length) {
        console.log('No active playlists found. Activating one...');
        const { data: anyPlaylist } = await supabase.from('playlists').select('id').limit(1);
        if (anyPlaylist?.length) {
            await supabase.from('playlists').update({ is_active: true }).eq('id', anyPlaylist[0].id);
            playlists = [anyPlaylist[0]];
        } else {
            console.log('No playlists exist to activate.');
            return;
        }
    }

    const playlistId = playlists[0].id;
    const { data: streams } = await supabase.from('streams').select('id, stream_id').eq('playlist_id', playlistId).limit(1);

    if (!streams?.length) {
        console.log('No streams found in active playlist.');
        return;
    }
    const streamId = streams[0].stream_id || streams[0].id;
    console.log('   Testing with Stream ID:', streamId);

    console.log('3. Simulating Stream Request...');
    const testUrl = `http://127.0.0.1:3000/live/test_active/password123/${streamId}.m3u8`;
    try {
        const res = await fetch(testUrl);
        console.log('   Status:', res.status);
        if (!res.ok) {
            const body = await res.text();
            console.log('   Error Body:', body);
        }
    } catch (e) {
        console.log('   Fetch failed (might be expected if backend errors on source):', e.message);
    }

    console.log('4. Verifying Log...');
    const { data: logs, error: logError } = await supabase
        .from('active_streams')
        .select('*')
        .eq('username', 'test_active')
        .eq('stream_id', streamId)
        .order('last_ping', { ascending: false })
        .limit(1);

    if (logError) {
        console.error('Log check error:', logError);
    } else if (logs?.length > 0) {
        console.log('SUCCESS: Active stream logged:', logs[0]);
    } else {
        console.log('FAILURE: No log found in active_streams.');
    }
}

runTest();
