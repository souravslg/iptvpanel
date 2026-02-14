
const { createClient } = require('@supabase/supabase-js');
// const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer node

// Polyfill fetch if needed (Node 18+ has it global)
const fetch = global.fetch;

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProxyThroughput() {
    // 1. Get a stream that uses DASH from playlist 44
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', 44)
        .eq('stream_format', 'mpd')
        .limit(1)
        .single();

    if (!stream) { console.log('No stream found'); return; }

    console.log('Testing Stream:', stream.name);
    console.log('Target URL:', stream.url);

    // 2. Simulate the Proxy Rewrite logic locally to see what the output would be
    // We can't hit the local Next.js API easily from this script without it running,
    // but we can simulate the fetch and rewrite logic to verify it produces valid XML.

    const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
    console.log('Using Headers:', headers);

    try {
        const response = await fetch(stream.url, { headers });
        if (!response.ok) {
            console.log('❌ Failed to fetch upstream:', response.status);
            return;
        }

        const text = await response.text();
        console.log('✅ Fetched Manifest. Size:', text.length);

        // 3. Apply Rewrite
        const headersToPass = {};
        if (headers['User-Agent']) headersToPass['User-Agent'] = headers['User-Agent'];
        if (headers['Cookie']) headersToPass['Cookie'] = headers['Cookie'];

        const headersQueryParam = encodeURIComponent(JSON.stringify(headersToPass));
        const baseUrl = new URL(stream.url);
        const protocol = 'http';
        const host = 'localhost:3000';

        const modifiedText = text.replace(/(https?:\/\/[^"<>\s]+)/g, (match) => {
            // Check if match is absolute
            try {
                const absoluteUrl = new URL(match).toString();
                // Rewrite to point to our proxy
                return `${protocol}://${host}/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}&headers=${headersQueryParam}`;
            } catch (e) {
                return match;
            }
        });

        console.log('\n--- Rewritten Manifest Preview ---');
        console.log(modifiedText.substring(0, 1000));

        // Check if rewrite happened
        if (modifiedText.includes('/api/proxy/stream?url=')) {
            console.log('✅ Rewrite Successful: URLs point to proxy.');
        } else {
            console.log('❌ Rewrite Failed: No proxy URLs found.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkProxyThroughput();
