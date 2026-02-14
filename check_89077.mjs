import { supabase } from './lib/supabase.js';

async function checkStream89077() {
    console.log('Checking stream 89077...');

    const { data: stream, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', 89077)
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
        console.log('Stream 89077 not found.');
    }
}

checkStream89077();
