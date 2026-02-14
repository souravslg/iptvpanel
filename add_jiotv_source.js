const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_SOURCE_URL = 'https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u';
const PLAYLIST_NAME = 'JioTV Xtream';

async function addJioTvSource() {
    console.log('=== Adding JioTV Source ===\n');

    // 1. Check if playlist exists or create it
    let playlistId;
    const { data: existingPlaylists, error: fetchError } = await supabase
        .from('playlists')
        .select('id, source_url')
        .eq('source_url', NEW_SOURCE_URL);

    if (fetchError) {
        console.error('Error checking existing playlists:', fetchError);
        return;
    }

    if (existingPlaylists && existingPlaylists.length > 0) {
        playlistId = existingPlaylists[0].id;
        console.log(`Playlist already exists with ID: ${playlistId}. Updating streams...`);
    } else {
        console.log('Creating new playlist...');
        const { data: newPlaylist, error: createError } = await supabase
            .from('playlists')
            .insert([{ name: PLAYLIST_NAME, source_url: NEW_SOURCE_URL }])
            .select()
            .single();

        if (createError) {
            console.error('Error creating playlist:', createError);
            return;
        }
        playlistId = newPlaylist.id;
        console.log(`Created new playlist with ID: ${playlistId}`);
    }

    // 2. Fetch M3U
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

    // 3. Delete existing streams for this playlist
    console.log(`\nClearing existing streams for playlist ${playlistId}...`);
    const { error: deleteError } = await supabase
        .from('streams')
        .delete()
        .eq('playlist_id', playlistId);

    if (deleteError) {
        console.log('❌ Delete Error:', deleteError.message);
        return;
    }
    console.log('✅ Streams cleared.');

    // 4. Parse Content
    console.log('Parsing content...');
    const lines = m3uContent.split('\n');
    console.log(`Total lines: ${lines.length}`);

    let streamsToAdd = [];
    let currentStream = {};

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
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

            // Capture specific headers if present in M3U (unlikely in standard but good to have)
            const userAgentMatch = line.match(/user-agent="([^"]+)"/i);
            if (userAgentMatch) {
                if (!currentStream.headers) currentStream.headers = {};
                currentStream.headers['User-Agent'] = userAgentMatch[1];
            }

        } else if (line.startsWith('#EXTVLCOPT:')) {
            if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
                if (!currentStream.headers) currentStream.headers = {};
                currentStream.headers['User-Agent'] = line.split('=')[1];
            }
        } else if (line.startsWith('#KODIPROP:')) {
            const prop = line.substring(10).trim();
            if (prop.includes('=')) {
                const equalsIndex = prop.indexOf('=');
                const key = prop.substring(0, equalsIndex).trim();
                const value = prop.substring(equalsIndex + 1).trim();

                if (key === 'inputstream.adaptive.license_type') {
                    currentStream.drm_scheme = value.toLowerCase();
                    if (currentStream.drm_scheme === 'org.w3.clearkey') currentStream.drm_scheme = 'clearkey';
                } else if (key === 'inputstream.adaptive.license_key') {
                    if (value.startsWith('{')) {
                        try {
                            const jwk = JSON.parse(value);
                            if (jwk.keys && jwk.keys.length > 0) {
                                const keyObj = jwk.keys[0];
                                if (keyObj.k && keyObj.kid) {
                                    currentStream.drm_key = Buffer.from(keyObj.k.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex');
                                    currentStream.drm_key_id = Buffer.from(keyObj.kid.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex');
                                    currentStream.drm_scheme = 'clearkey';
                                }
                            }
                        } catch (e) { }
                    } else {
                        // Handle simple key string (e.g. key_id:key or just key)
                        // It seems the format is typically key_id:key or just a hex string
                        // Based on the log, it looks like a hex string: ec7d00...
                        // If it's just a hex string, it might be the key itself, or key:key_id?
                        // Let's assume standard hex key. Wait, Clearkey usually needs ID and Key.
                        // If only one value is provided, maybe it's the key and ID is derived or same?
                        // Or maybe it is key_id:key format but without braces?
                        // Inspecting "Star Sports 1 HD" from log: 
                        // #KODIPROP:inputstream.adaptive.license_key=ec7d009d07aa5cbc81a441880530d...
                        // This looks like a single hex string. 
                        // Actually, standard defined as: license_type=clearkey, license_key=userid:userkey
                        // But here it seems to be just one long string? 

                        // Let's try to interpret it. If it contains ':', split it.
                        if (value.includes(':')) {
                            const parts = value.split(':');
                            // Usually keyId:key
                            currentStream.drm_key_id = parts[0];
                            currentStream.drm_key = parts[1];
                            currentStream.drm_scheme = 'clearkey';
                        } else {
                            // If no colon, maybe it's just the key?? 
                            // Or maybe TiviMate expects just license_url to be this value?
                            // But for clearkey we need key_id and key. 
                            // Let's look closer at the log. 
                            // #KODIPROP:inputstream.adaptive.license_key=ec7d...
                            // It is 32 bytes (64 hex chars)? 
                            // If so, it might be the KEY. But what is the ID?
                            // Sometimes ID is in the MPD?

                            // If we can't find ID, we can try to save this as key and let player figure it out?
                            // But XTREAM codes needs separate fields.

                            // Let's save it as key and use same for ID if length matches?
                            if (value.length > 30) {
                                // Assume it's a key. Use it for both? Or leave ID null?
                                // If we leave ID null, my analyze script says it's broken.
                                // Let's try setting both to this value if valid hex?
                                currentStream.drm_key = value;
                                // currentStream.drm_key_id = value; // Risky?
                                currentStream.drm_scheme = 'clearkey';
                            }
                        }
                    }
                }
            }
        } else if (!line.startsWith('#')) {
            currentStream.url = line;
            currentStream.playlist_id = playlistId;

            if (currentStream.name && currentStream.url) {
                if (!currentStream.stream_id) {
                    currentStream.stream_id = Math.floor(Math.random() * 1000000000).toString();
                }

                streamsToAdd.push({
                    playlist_id: playlistId,
                    stream_id: currentStream.stream_id,
                    name: currentStream.name,
                    url: currentStream.url,
                    logo: currentStream.logo,
                    category: currentStream.category,
                    headers: currentStream.headers || null,
                    drm_scheme: currentStream.drm_scheme || null,
                    drm_key_id: currentStream.drm_key_id || null,
                    drm_key: currentStream.drm_key || null,
                    type: 'live'
                });
            }
            currentStream = {};
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
                process.stdout.write('.');
            }
        }
        console.log('\n✅ Insert complete.');
    } else {
        console.log('❌ No streams to insert.');
    }

    // 5. Verification
    const { count } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

    console.log(`\nFinal Stream Count in DB for Playlist ${playlistId}: ${count}`);
}

addJioTvSource().catch(console.error);
