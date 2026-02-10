const { createClient } = require('@supabase/supabase-js');

// Hardcoded creds
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying JTV DB operations...');

    // 1. Write dummy content
    console.log('Writing dummy content...');
    const { error: writeError } = await supabase
        .from('settings')
        .upsert({
            key: 'jtv_playlist_content_test',
            value: '#EXTM3U\n#EXTINF:-1,Test\nhttp://test.com'
        }, { onConflict: 'key' });

    if (writeError) {
        console.error('Write Failed:', writeError);
        return;
    }
    console.log('Write Success');

    // 2. Read it back
    console.log('Reading content...');
    const { data, error: readError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'jtv_playlist_content_test')
        .single();

    if (readError) {
        console.error('Read Failed:', readError);
        return;
    }

    if (data.value.includes('#EXTM3U')) {
        console.log('Read Success: Content matches');
    } else {
        console.error('Read Failed: Content mismatch', data);
    }

    // Clean up
    await supabase.from('settings').delete().eq('key', 'jtv_playlist_content_test');
}

verify();
