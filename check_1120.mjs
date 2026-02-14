import { supabase } from './lib/supabase.js';

async function checkStream1120() {
    console.log('Checking stream 1120...');

    // Check both id and stream_id
    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .or(`id.eq.1120,stream_id.eq.1120`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (streams && streams.length > 0) {
        streams.forEach(stream => {
            console.log(`[${stream.id}] ${stream.name}`);
            console.log(`   Stream ID: ${stream.stream_id}`);
            console.log(`   URL: ${stream.url}`);
            console.log(`   Headers:`, stream.headers);
            if (typeof stream.headers === 'string') console.log('   (String format)');
            else console.log('   (Object format)');

            // Simulating the check
            const h = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : (stream.headers || {});
            const hasCookie = h.cookie || h.Cookie || h['User-Agent'] || h['user-agent'];
            console.log(`   Triggers Force Proxy? ${!!hasCookie}`);
        });
    } else {
        console.log('Stream 1120 not found.');
    }
}

checkStream1120();
