import { supabase } from './lib/supabase.js';

async function checkStreamHeaders() {
    console.log('Checking stream headers...');

    const { data: streams, error } = await supabase
        .from('streams')
        .select('name, headers, url')
        .ilike('name', '%Vande Gujarat 1%')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (streams && streams.length > 0) {
        const s = streams[0];
        console.log('Stream:', s.name);
        console.log('URL:', s.url);
        console.log('Headers (Raw):', s.headers);
        if (typeof s.headers === 'string') {
            console.log('Headers (Parsed):', JSON.parse(s.headers));
        }
    } else {
        console.log('Stream not found.');
    }
}

checkStreamHeaders();
