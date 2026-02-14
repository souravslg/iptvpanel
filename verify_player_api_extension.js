const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyExtensionLogic() {
    // Pick a stream from playlist 44 (which we know is MPD)
    // We'll use the one from inspect output (ID: 15729 or similar)
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', 44)
        .eq('stream_format', 'mpd')
        .limit(1)
        .single();

    if (!stream) {
        console.log('No stream found for testing');
        return;
    }

    console.log(`Stream: ${stream.name}`);
    console.log(`Format: ${stream.stream_format}`);

    // Simulate Logic from player_api/route.js
    let extension = 'ts'; // default
    if (stream.type === 'movie') {
        extension = 'mp4';
    } else if (stream.stream_format) {
        if (stream.stream_format === 'mpd') extension = 'mpd';
        else if (stream.stream_format === 'm3u8' || stream.stream_format === 'hls') extension = 'm3u8';
    }

    console.log(`Calculated Extension: .${extension}`);

    if (extension !== 'mpd') {
        console.error('FAIL: Expected .mpd extension');
    } else {
        console.log('PASS: Correctly identified as .mpd');
    }
}

verifyExtensionLogic();
