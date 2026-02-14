import { supabase } from './lib/supabase.js';

async function setDirectMode() {
    console.log('Setting stream_mode to direct...');

    // Update or insert stream_mode = direct
    const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'stream_mode')
        .single();

    let result;
    if (existing) {
        result = await supabase
            .from('settings')
            .update({ value: 'direct' })
            .eq('key', 'stream_mode')
            .select();
    } else {
        result = await supabase
            .from('settings')
            .insert({ key: 'stream_mode', value: 'direct' })
            .select();
    }

    const { data, error } = result;

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Updated setting:', data);
    }
}

setDirectMode();
