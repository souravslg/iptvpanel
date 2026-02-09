const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixJTV() {
    console.log('Fixing JTV Auto-Gen status...');

    // Find JTV playlist
    const { data: playlists } = await supabase
        .from('playlists')
        .select('id, name, is_active')
        .eq('name', 'JTV Auto-Gen');

    if (!playlists || playlists.length === 0) {
        console.log('JTV Auto-Gen playlist not found.');
        return;
    }

    const jtv = playlists[0];
    console.log(`Found JTV Playlist: ${jtv.name} (ID: ${jtv.id}), Active: ${jtv.is_active}`);

    if (jtv.is_active) {
        console.log('Already active.');
        return;
    }

    const { error } = await supabase
        .from('playlists')
        .update({ is_active: true })
        .eq('id', jtv.id);

    if (error) {
        console.error('Error updating playlist:', error);
    } else {
        console.log('Successfully set is_active = true');
    }
}

fixJTV();
