import { supabase } from './lib/supabase.js';

async function checkStream84339() {
    console.log('Checking stream 84339...');

    const { data: stream, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', 84339)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (stream) {
        console.log('ID:', stream.id);
        console.log('Name:', stream.name);
        console.log('URL:', stream.url);
        console.log('Headers (Raw Type):', typeof stream.headers);
        console.log('Headers (Raw Value):', stream.headers);
    } else {
        console.log('Stream 84339 not found.');
    }
}

checkStream84339();
