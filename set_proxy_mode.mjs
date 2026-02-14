import { supabase } from './lib/supabase.js';

async function setProxyMode() {
    console.log('Setting stream_mode to proxy...');

    const { data, error } = await supabase
        .from('settings')
        .update({ value: 'proxy' })
        .eq('key', 'stream_mode')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Updated setting:', data);
    }
}

setProxyMode();
