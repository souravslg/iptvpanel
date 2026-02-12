
import { supabase } from './lib/supabase.js';
// Native fetch used

async function testStream() {
    console.log('--- Testing Stream Access ---');

    // 1. Get a random stream from active playlist
    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .limit(1);

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    if (!streams || streams.length === 0) {
        console.error('No streams found in DB');
        return;
    }

    const stream = streams[0];
    console.log('Testing Stream:', stream.name);
    console.log('URL:', stream.url);

    try {
        const res = await fetch(stream.url);
        console.log('Status:', res.status);
        console.log('Status Text:', res.statusText);
        if (res.status === 451) {
            console.error('!!! DETECTED ERROR 451 !!!');
            console.error('The upstream provider is blocking access for legal reasons.');
        } else if (!res.ok) {
            console.error('Stream is not accessible.');
        } else {
            console.log('Stream is accessible.');
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

// Check for fetch
if (!globalThis.fetch) {
    // fallback or assume node 18
}

testStream();
