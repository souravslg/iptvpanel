const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStreams() {
    // Get valid user
    const { data: users } = await supabase.from('users').select('*').eq('status', 'Active').limit(1);
    if (!users || users.length === 0) return console.log('No user');
    const user = users[0];

    // Get active playlist IDs
    const { data: playlists } = await supabase.from('playlists').select('id').eq('is_active', true);
    const pIds = playlists.map(p => p.id);

    // Get 5 streams
    const { data: streams } = await supabase.from('streams').select('*').in('playlist_id', pIds).limit(5);

    console.log(`Checking ${streams.length} streams using proxy...`);

    for (const stream of streams) {
        const testUrl = `http://localhost:3000/live/${user.username}/${user.password}/${stream.stream_id}.ts`;
        console.log(`\nStream: ${stream.name} (${stream.stream_id})`);
        try {
            const res = await fetch(testUrl, { method: 'HEAD', redirect: 'manual' });
            console.log(`Proxy Status: ${res.status}`);

            if (res.status >= 300 && res.status < 400) {
                const loc = res.headers.get('location');
                console.log(`Redirect: ${loc}`);
                const res2 = await fetch(loc, { method: 'HEAD' });
                console.log(`Target Status: ${res2.status}`);
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}

checkStreams();
