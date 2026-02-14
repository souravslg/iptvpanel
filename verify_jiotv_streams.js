const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStreams() {
    const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', 44)
        .limit(5);

    if (error) {
        console.error('Error fetching streams:', error);
        return;
    }

    console.log('Sample Streams for Playlist 44:');
    data.forEach(s => {
        console.log(`ID: ${s.stream_id}, Name: ${s.name}, URL: ${s.url}, Category: ${s.category}`);
    });
}

verifyStreams();
