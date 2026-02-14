const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_SOURCE_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u';
const PLAYLIST_ID = 30;

async function advancedImport() {
    console.log('=== Advanced Playlist Import ===\n');

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
    let streamsToAdd = [];

    let currentStream = {
        drm_scheme: null,
        drm_license_url: null,
        headers: {}
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#KODIPROP:')) {
            // Parse KODIPROP
            const prop = line.substring('#KODIPROP:'.length).trim();
            const [key, value] = prop.split('=');

            if (key === 'inputstream.adaptive.license_type') {
                currentStream.drm_scheme = value;
            } else if (key === 'inputstream.adaptive.license_key') {
                currentStream.drm_license_url = value;
            }

        } else if (line.startsWith('#EXTINF:')) {
            // Parse Metadata
            const commaIndex = line.lastIndexOf(',');
            if (commaIndex !== -1) {
                currentStream.name = line.substring(commaIndex + 1).trim();
            } else {
                currentStream.name = 'Unknown';
            }

            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            currentStream.logo = logoMatch ? logoMatch[1] : null;

            const idMatch = line.match(/tvg-id="([^"]+)"/);
            currentStream.stream_id = idMatch ? idMatch[1] : null;

            const groupMatch = line.match(/group-title="([^"]+)"/);
            currentStream.category = groupMatch ? groupMatch[1] : 'Uncategorized';

        } else if (!line.startsWith('#')) {
            // URL & Headers
            let finalUrl = line;
            let headers = {};

            // Check for pipe headers: URL|Header1=Value1&Header2=Value2
            if (line.includes('|')) {
                const parts = line.split('|');
                finalUrl = parts[0];
                const headerString = parts[1]; // Cookie=...&User-Agent=...

                // Parse headers string
                // Note: Values might contain = or &, so be careful
                // Usually formatted like URL query params
                const headerPairs = headerString.split('&');
                for (const pair of headerPairs) {
                    const eqIndex = pair.indexOf('=');
                    if (eqIndex !== -1) {
                        const key = pair.substring(0, eqIndex);
                        const val = pair.substring(eqIndex + 1);
                        headers[key] = val;
                    }
                }
            }

            currentStream.url = finalUrl;
            currentStream.headers = headers;
            currentStream.playlist_id = PLAYLIST_ID;

            if (currentStream.name && currentStream.url) {
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
                    type: 'live',
                    drm_scheme: currentStream.drm_scheme,
                    drm_license_url: currentStream.drm_license_url // Contains key for clearkey
                });

                // We need to handle headers separately becausesupabase insert might not like JSON object directly?
                // Or maybe it does. Let's try. If it fails, checks.
                streamsToAdd[streamsToAdd.length - 1].headers = currentStream.headers;
            }

            // Reset for next stream
            currentStream = {
                drm_scheme: null,
                drm_license_url: null,
                headers: {}
            };
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
                // Print a sample to debug payload
                if (i === 0) console.log(JSON.stringify(batch[0], null, 2));
            } else {
                process.stdout.write('.');
            }
        }
        console.log('\n✅ Insert complete.');
    } else {
        console.log('❌ No streams to insert.');
    }
}

advancedImport().catch(console.error);
