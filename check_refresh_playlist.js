const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshPlaylistTokens() {
    console.log('=== Refreshing Playlist for Fresh Tokens ===\n');

    // Get playlist info
    const { data: playlist } = await supabase
        .from('playlists')
        .select('id, name, source_url')
        .eq('id', 30)
        .single();

    if (!playlist) {
        console.log('❌ Playlist 30 not found');
        return;
    }

    console.log(`Playlist: ${playlist.name}`);
    console.log(`Source: ${playlist.source_url}\n`);

    // Fetch fresh M3U from source
    console.log('Fetching fresh M3U from source...');
    try {
        const response = await fetch(playlist.source_url);
        const m3uContent = await response.text();
        const lines = m3uContent.split('\n');

        // Find a sample stream URL
        let sampleUrl = null;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() && !lines[i].startsWith('#') && lines[i].includes('jio')) {
                sampleUrl = lines[i].trim();
                break;
            }
        }

        if (sampleUrl) {
            console.log(`Sample URL from source M3U:`);
            console.log(sampleUrl);
            console.log('');

            if (sampleUrl.includes('hdnts=')) {
                console.log('✅ Source M3U has URLs with tokens!');
                console.log('\nRECOMMENDATION:');
                console.log('Refresh the playlist in the admin panel to get fresh URLs with tokens.');
                console.log('This will update all streams with working URLs.');
            } else {
                console.log('⚠️ Source M3U URLs also don\'t have tokens');
                console.log('The M3U source might not include token-based URLs.');
            }
        }

    } catch (err) {
        console.log(`❌ Error fetching M3U: ${err.message}`);
    }

    console.log('\n=== SOLUTION ===');
    console.log('Option 1: Refresh playlist in admin panel to get fresh URLs');
    console.log('Option 2: Set up automatic playlist refresh (cronjob)');
    console.log('Option 3: Use a different playlist source with persistent URLs');
}

refreshPlaylistTokens().catch(console.error);
