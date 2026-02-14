import { supabase } from './lib/supabase.js';

async function checkStream89077() {
    console.log('Checking stream 89077 headers...');

    const { data: stream, error } = await supabase
        .from('streams')
        .select('name, headers')
        .eq('id', 89077)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (stream) {
        console.log('Stream:', stream.name);
        console.log('Headers:', JSON.stringify(stream.headers, null, 2));
    }
}

checkStream89077();
