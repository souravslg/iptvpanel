const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectManifest() {
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', 44)
        .eq('stream_format', 'mpd')
        .limit(1)
        .single();

    if (!stream) { console.log('No stream'); return; }

    console.log('Fetching:', stream.url);

    // Construct headers
    const headers = {};
    if (stream.headers) {
        const h = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        if (h.cookie) headers.Cookie = h.cookie;
        if (h['User-Agent']) headers['User-Agent'] = h['User-Agent'];
    }

    try {
        const res = await fetch(stream.url, { headers });
        if (res.ok) {
            const text = await res.text();
            console.log('\n--- Manifest Preview ---');
            console.log(text.substring(0, 1000));

            // Check for absolute URLs
            if (text.includes('http://') || text.includes('https://')) {
                console.log('\nWARNING: Manifest likely contains absolute URLs.');
            } else {
                console.log('\nManifest uses relative URLs (Good for proxy, bad for direct play if base missing?).');
            }
        } else {
            console.log('Fetch failed:', res.status);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

inspectManifest();
