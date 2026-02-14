
import { supabase } from '../lib/supabase.js';

const SOURCE_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/jtv.m3u';

async function setSource() {
    console.log(`Setting jtv_playlist_url to: ${SOURCE_URL}`);

    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'jtv_playlist_url',
            value: SOURCE_URL
        }, { onConflict: 'key' });

    if (error) {
        console.error('Error updating setting:', error);
    } else {
        console.log('Successfully updated setting.');
    }
}

setSource();
