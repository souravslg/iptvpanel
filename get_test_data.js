const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getData() {
    // 1. Get a valid user
    const { data: users } = await supabase.from('users').select('*').eq('status', 'Active').limit(1);
    if (!users || users.length === 0) {
        console.error('No active users found.');
        return;
    }
    const user = users[0];
    console.log('User:', { username: user.username, password: user.password });

    // 2. Get a valid stream
    const { data: playlists } = await supabase.from('playlists').select('id').eq('is_active', true);
    if (!playlists || playlists.length === 0) {
        console.error('No active playlists found.');
        return;
    }
    const ids = playlists.map(p => p.id);
    const { data: streams } = await supabase.from('streams').select('*').in('playlist_id', ids).limit(1);

    if (!streams || streams.length === 0) {
        console.error('No streams found.');
        return;
    }
    const stream = streams[0];
    console.log('Stream:', {
        id: stream.id,
        stream_id: stream.stream_id,
        name: stream.name,
        url: stream.url
    });

    console.log('\nTest URL:');
    console.log(`http://localhost:3000/live/${user.username}/${user.password}/${stream.stream_id}.ts`);
}

getData();
