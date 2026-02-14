import { supabase } from './lib/supabase.js';

async function check1120Url() {
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('stream_id', 1120)
        .single();

    if (stream) {
        console.log('Stream:', stream.name);
        console.log('URL:', stream.url);
        console.log('Headers:', stream.headers);

        if (stream.url.includes('?__hdnea__=')) console.log('✅ URL format correct');
        else if (stream.url.includes('&__hdnea__=')) console.log('✅ URL format correct (appended)');
        else console.log('❌ URL missing token parameter');
    } else {
        console.log('Stream 1120 not found');
    }
}

check1120Url();
