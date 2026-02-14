const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_SOURCE_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u';
const PLAYLIST_ID = 30;

async function reimportPlaylist() {
    console.log('=== Re-importing Playlist ===\n');

    // 1. Fetch M3U
    console.log(`Fetching from: ${NEW_SOURCE_URL}`);
    let m3uContent = '';
    try {
        const response = await fetch(NEW_SOURCE_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        m3uContent = await response.text();
        console.log(`✅ Fetched ${m3uContent.length} bytes`);
    } catch (e) {
        console.log('❌ Error fetching:', e.message);
        return;
    }

    if (!m3uContent || m3uContent.length < 100) {
        console.log('❌ Content too short/empty');
        return;
    }

    // 2. Delete existing streams
    console.log('\nClearing existing streams for playlist 30...');
    const { error: deleteError } = await supabase
        .from('streams')
        .delete()
        .eq('playlist_id', PLAYLIST_ID);

    if (deleteError) {
        console.log('❌ Delete Error:', deleteError.message);
        return;
    }
    console.log('✅ Streams cleared.');

    // 3. Parse
    console.log('Parsing content...');
    const lines = m3uContent.split('\n');
    console.log(`Total lines: ${lines.length}`);

    let streamsToAdd = [];
    let currentStream = {};
    let parseCount = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // Basic Parse
            // Find the *last* comma for name? Or first?
            // Standard M3U extinf: #EXTINF:dur attributes,Name

            // Regex to match the info AFTER the comma (Name)
            const commaIndex = line.lastIndexOf(',');
            if (commaIndex !== -1) {
                currentStream.name = line.substring(commaIndex + 1).trim();
            } else {
                currentStream.name = 'Unknown';
            }

            // Attributes
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            currentStream.logo = logoMatch ? logoMatch[1] : null;

            const idMatch = line.match(/tvg-id="([^"]+)"/);
            currentStream.stream_id = idMatch ? idMatch[1] : null;

            const groupMatch = line.match(/group-title="([^"]+)"/);
            currentStream.category = groupMatch ? groupMatch[1] : 'Uncategorized';

        } else if (!line.startsWith('#')) {
            // URL
            currentStream.url = line;
            currentStream.playlist_id = PLAYLIST_ID;

            if (currentStream.name && currentStream.url) {
                // Determine format
                // If it's JIO, ensure we don't need tokens or headers?
                // The prompt says this merged3.m3u works perfectly.

                // Fallback stream_id
                if (!currentStream.stream_id) {
                    currentStream.stream_id = Math.floor(Math.random() * 1000000000).toString();
                }

                streamsToAdd.push({
                    playlist_id: PLAYLIST_ID,
                    stream_id: currentStream.stream_id,
                    name: currentStream.name,
                    url: currentStream.url,
                    logo: currentStream.logo,
                    category: currentStream.category,
                    type: 'live'
                });
                parseCount++;
            }
            currentStream = {}; // Reset
        }
    }

    console.log(`Parsed ${streamsToAdd.length} streams.`);

    if (streamsToAdd.length > 0) {
        console.log('Inserting into database...');
        const BATCH_SIZE = 100;
        for (let i = 0; i < streamsToAdd.length; i += BATCH_SIZE) {
            const batch = streamsToAdd.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase.from('streams').insert(batch);

            if (insertError) {
                console.log(`❌ Batch Error (index ${i}):`, insertError.message);
            } else {
                process.stdout.write('.'); // Progress dot
            }
        }
        console.log('\n✅ Insert complete.');
    } else {
        console.log('❌ No streams to insert.');
    }

    // 4. Verification
    const { count } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', PLAYLIST_ID);

    console.log(`\nFinal Stream Count in DB for Playlist 30: ${count}`);
}

reimportPlaylist().catch(console.error);
