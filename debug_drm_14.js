const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Checking for any DRM streams in playlist 14 ---');
    const { data: streams } = await supabase
        .from('streams')
        .select('id, name, drm_scheme, drm_license_url')
        .eq('playlist_id', 14)
        .not('drm_scheme', 'is', null);
    console.log(JSON.stringify(streams, null, 2));
}

debug();
