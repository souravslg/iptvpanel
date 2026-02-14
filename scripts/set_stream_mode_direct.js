
import { supabase } from '../lib/supabase.js';

async function setStreamMode() {
    console.log('Setting stream_mode to: direct');

    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'stream_mode',
            value: 'direct'
        }, { onConflict: 'key' });

    if (error) {
        console.error('Error updating setting:', error);
    } else {
        console.log('Successfully updated stream_mode to direct.');
    }
}

setStreamMode();
