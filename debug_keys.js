const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    let output = '--- Debugging Channel Keys ---\n\n';

    // 1. Fetch Star Sports HD
    const { data: starSports } = await supabase
        .from('streams')
        .select('name, drm_scheme, drm_key_id, drm_key')
        .ilike('name', '%Star%Sports%Select%1%HD%')
        .limit(1);

    if (starSports?.[0]) {
        output += `[Working] Star Sports Select 1 HD:\n`;
        output += `Scheme: ${starSports[0].drm_scheme}\n`;
        output += `Key ID: ${starSports[0].drm_key_id}\n`;
        output += `Key:    ${starSports[0].drm_key}\n\n`;
    } else {
        output += `Star Sports Select 1 HD not found.\n\n`;
    }

    // 2. Fetch NE News (Non-working candidate)
    const { data: neNews } = await supabase
        .from('streams')
        .select('name, drm_scheme, drm_key_id, drm_key')
        .ilike('name', '%NE%News%')
        .limit(1);

    if (neNews?.[0]) {
        output += `[Non-Working] NE News:\n`;
        output += `Scheme: ${neNews[0].drm_scheme}\n`;
        output += `Key ID: ${neNews[0].drm_key_id}\n`;
        output += `Key:    ${neNews[0].drm_key}\n\n`;
    } else {
        output += `NE News not found.\n\n`;
    }

    // 3. Check stats of missing keys
    const { count, error } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .is('drm_key', null)
        .eq('drm_scheme', 'clearkey');

    output += `Total channels with 'clearkey' scheme but NULL key: ${count}\n`;

    fs.writeFileSync('debug_keys.txt', output);
    console.log('Debug output written to debug_keys.txt');
}

runDebug();
