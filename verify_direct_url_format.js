const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDirectSource() {
    // Pick a stream from playlist 44 (which we know is MPD)
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', 44)
        .eq('stream_format', 'mpd')
        .limit(1)
        .single();

    if (!stream) {
        console.log('No stream found for testing');
        return;
    }

    // Simulate Logic from player_api/route.js (direct mode)
    let directSourceUrl = stream.url;

    if (stream.headers) {
        const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        const headerParts = [];
        const getHeader = (key) => headers[key] || headers[key.toLowerCase()];

        const ua = getHeader('User-Agent');
        if (ua) headerParts.push(`User-Agent=${ua}`);

        const ref = getHeader('Referer') || getHeader('Origin');
        if (ref) headerParts.push(`Referer=${ref}`);

        if (headerParts.length > 0) {
            const pipeHeaders = headerParts.join('&');
            if (directSourceUrl) directSourceUrl += `|${pipeHeaders}`;
        }
    }

    console.log(`Direct Source URL: ${directSourceUrl}`);

    // Check if URL has query params AND pipe headers
    if (directSourceUrl.includes('|') && directSourceUrl.includes('?')) {
        console.log('WARNING: URL has query params AND pipe headers. TiviMate might misinterpret if not correctly formatted.');
        // Usually pipe headers are fine after query params.
    }
}

verifyDirectSource();
