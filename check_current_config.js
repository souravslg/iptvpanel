
import { supabase } from './lib/supabase.js';

async function checkConfig() {
    console.log('--- Checking Playlists ---');
    const { data: playlists, error: plError } = await supabase
        .from('playlists')
        .select('*');

    if (plError) console.error('Error fetching playlists:', plError);
    else console.log(JSON.stringify(playlists, null, 2));

    console.log('\n--- Checking Settings ---');
    const { data: settings, error: setError } = await supabase
        .from('settings')
        .select('key, value') // Select value too to see content
        .in('key', ['jtv_playlist_content', 'jtv_metadata', 'jtv_playlist_url']);

    if (setError) console.error('Error fetching settings:', setError);
    else {
        settings.forEach(s => {
            console.log(`Key: ${s.key}`);
            console.log(`Value: ${s.value ? (s.value.length > 100 ? s.value.substring(0, 100) + '...' : s.value) : 'null'}`);
        });
    }

    console.log('\n--- Checking Users (First 5) ---');
    const { data: users, error: uError } = await supabase
        .from('users')
        .select('username, status, expire_date')
        .limit(5);

    if (uError) console.error('Error fetching users:', uError);
    else console.log(JSON.stringify(users, null, 2));
}

checkConfig();
