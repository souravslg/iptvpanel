const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectStreams() {
    const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', 44)
        .limit(3);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Sample Streams from Playlist 44:');
        data.forEach(s => {
            console.log('\n--- Stream ---');
            console.log('ID:', s.id);
            console.log('Stream ID:', s.stream_id);
            console.log('Name:', s.name);
            console.log('URL:', s.url);
            console.log('Format:', s.stream_format);
            console.log('DRM Scheme:', s.drm_scheme);
            console.log('Headers:', s.headers);
        });
    }
}

inspectStreams();
