
import { supabase } from '../lib/supabase.js';

const MODE = 'direct'; // 'proxy', 'redirect', 'direct'

async function setStreamMode() {
    console.log(`Setting stream_mode to "${MODE}"...`);

    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'stream_mode',
            value: MODE
        }, { onConflict: 'key' });

    if (error) {
        console.error('Error setting stream mode:', error);
    } else {
        console.log('Stream mode updated successfully.');
    }
}

setStreamMode();
