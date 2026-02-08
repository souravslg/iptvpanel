const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Checking for duplicate stream_ids ---');
    const { data: streams } = await supabase
        .from('streams')
        .select('id, name, stream_id, playlist_id')
        .eq('stream_id', '0-9-zeesalaam');
    console.log(JSON.stringify(streams, null, 2));

    console.log('\n--- Checking for stream 175 duplicates ---');
    const { data: streams2 } = await supabase
        .from('streams')
        .select('id, name, stream_id, playlist_id')
        .eq('stream_id', '175');
    console.log(JSON.stringify(streams2, null, 2));
}

debug();
