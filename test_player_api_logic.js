const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock the API logic locally since we can't easily curl the running Next.js app from here (or maybe we can if port 3000 is open)
// But to be safe, let's just run the key logic against the DB.

async function testPlayerApi() {
    // 1. Get user
    const { data: user } = await supabase.from('users').select('*').limit(1).single();
    if (!user) { console.log('No user found'); return; }
    console.log(`User: ${user.username}`);

    // 2. Get active playlists
    const { data: playlists } = await supabase.from('playlists').select('id').eq('is_active', true);
    const playlistIds = playlists.map(p => p.id);

    // 3. Get streams
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .in('playlist_id', playlistIds)
        .limit(1); // just one

    const stream = streams[0];
    console.log(`Stream: ${stream.name}`);

    // 4. Simulate logic
    let streamUrl = stream.url;

    if (stream.headers) {
        const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        console.log('Headers found:', headers);

        const headerParts = [];
        const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

        const ua = getHeader('User-Agent');
        if (ua) headerParts.push(`User-Agent=${ua}`);

        const ref = getHeader('Referer') || getHeader('Origin');
        if (ref) headerParts.push(`Referer=${ref}`);

        // Pipe construction
        if (headerParts.length > 0) {
            const pipeHeaders = headerParts.join('&');
            if (streamUrl) streamUrl += `|${pipeHeaders}`;
        }
    }

    console.log('Resulting URL (Direct Mode):', streamUrl);
}

testPlayerApi();
