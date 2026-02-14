const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyHeaders() {
    const { data, error } = await supabase
        .from('streams')
        .select('stream_id, name, headers')
        .eq('playlist_id', 43)
        .not('headers', 'is', null) // Filter for streams that HAVE headers
        .limit(3);

    if (error) {
        console.error('Error fetching streams:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No streams found with headers for playlist 43.');
        // This would be bad if the M3U has #EXTVLCOPT
        // Let's also check a raw dump of first 3 streams regardless of headers to see if they are just null
        const { data: allData } = await supabase.from('streams').select('name, headers').eq('playlist_id', 43).limit(3);
        console.log('Sample raw streams:', allData);
    } else {
        console.log('Streams with headers:', JSON.stringify(data, null, 2));
    }
}

verifyHeaders();
