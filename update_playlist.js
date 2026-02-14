const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_SOURCE_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u';
const PLAYLIST_ID = 30;

async function updateAndRefreshPlaylist() {
    console.log('=== Updating Playlist Source ===\n');

    // 1. Update Source URL
    console.log(`Updating playlist ${PLAYLIST_ID} source to:\n${NEW_SOURCE_URL}\n`);

    const { error: updateError } = await supabase
        .from('playlists')
        .update({ source_url: NEW_SOURCE_URL })
        .eq('id', PLAYLIST_ID);

    if (updateError) {
        console.log('❌ Error updating source:', updateError.message);
        return;
    }
    console.log('✅ Source URL updated.');

    // 2. Fetch the new M3U content to parse streams (Simulation of refresh)
    console.log('\nFetching new M3U content...');
    let m3uContent = '';
    try {
        const response = await fetch(NEW_SOURCE_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        m3uContent = await response.text();
        console.log(`✅ Fetched ${m3uContent.length} bytes`);
    } catch (e) {
        console.log('❌ Error fetching M3U:', e.message);
        return;
    }

    // 3. Clear existing streams for this playlist
    console.log('\nClearing old streams...');
    const { error: deleteError } = await supabase
        .from('streams')
        .delete()
        .eq('playlist_id', PLAYLIST_ID);

    if (deleteError) {
        console.log('❌ Error deleting streams:', deleteError.message);
        return;
    }
    console.log('✅ Old streams deleted.');

    // 4. Parse and Insert new streams (Basic parser)
    console.log('Parsing and inserting new streams...');
    const lines = m3uContent.split('\n');
    let streamsToAdd = [];
    let currentStream = {};

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            const nameMatch = line.match(/,(.+)$/);
            currentStream.name = nameMatch ? nameMatch[1].trim() : 'Unknown';

            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            currentStream.logo = logoMatch ? logoMatch[1] : null;

            const idMatch = line.match(/tvg-id="([^"]+)"/);
            currentStream.stream_id = idMatch ? idMatch[1] : `stream_${Date.now()}_${i}`; // Fallback ID

            const groupMatch = line.match(/group-title="([^"]+)"/);
            currentStream.category_id = groupMatch ? 1 : 0; // Simplified category logic

        } else if (!line.startsWith('#')) {
            // It's a URL
            currentStream.url = line;
            currentStream.playlist_id = PLAYLIST_ID;

            // Add to batch
            if (currentStream.name && currentStream.url) {
                // Ensure stream_id is unique/valid or just use a generated one if missing
                if (!currentStream.stream_id) currentStream.stream_id = Math.floor(Math.random() * 1000000).toString();

                streamsToAdd.push({
                    playlist_id: PLAYLIST_ID,
                    stream_id: currentStream.stream_id,
                    name: currentStream.name,
                    url: currentStream.url,
                    logo: currentStream.logo,
                    category_id: currentStream.category_id || 0
                });
            }
            currentStream = {}; // Reset
        }
    }

    // Insert to DB
    if (streamsToAdd.length > 0) {
        // Insert in batches of 100
        console.log(`Inserting ${streamsToAdd.length} streams...`);
        for (let i = 0; i < streamsToAdd.length; i += 100) {
            const batch = streamsToAdd.slice(i, i + 100);
            const { error: insertError } = await supabase.from('streams').insert(batch);
            if (insertError) console.log(`❌ Batch insert error: ${insertError.message}`);
        }
        console.log('✅ All streams inserted.');
    } else {
        console.log('⚠️ No streams parsed from M3U');
    }

    // 5. Verify a sample
    console.log('\nVerifying new data...');
    const { data: verifyStreams } = await supabase
        .from('streams')
        .select('name, url')
        .eq('playlist_id', PLAYLIST_ID)
        .limit(1);

    if (verifyStreams && verifyStreams.length > 0) {
        console.log(`Sample: ${verifyStreams[0].name}`);
        console.log(`URL: ${verifyStreams[0].url}`);
    }
}

updateAndRefreshPlaylist().catch(console.error);
