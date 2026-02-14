const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStreamFormats() {
    console.log('=== Checking Stream Formats ===\n');

    // Get sample streams and check their actual source URLs
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name, url')
        .in('playlist_id', [30])
        .limit(5);

    if (!streams || streams.length === 0) {
        console.log('❌ No streams found');
        return;
    }

    console.log('Sample stream source URLs:\n');
    for (const stream of streams) {
        console.log(`${stream.name}:`);
        console.log(`  URL: ${stream.url}`);

        // Determine format from URL
        if (stream.url.includes('.m3u8')) {
            console.log(`  Format: HLS (M3U8) ✅ OTT Navigator compatible`);
        } else if (stream.url.includes('.mpd')) {
            console.log(`  Format: DASH (MPD) ❌ OTT Navigator NOT compatible`);
        } else if (stream.url.includes('.ts')) {
            console.log(`  Format: MPEG-TS ✅ OTT Navigator compatible`);
        } else {
            console.log(`  Format: Unknown (checking...)`);

            // Try to fetch and check content-type
            try {
                const response = await fetch(stream.url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                const contentType = response.headers.get('content-type');
                console.log(`  Content-Type: ${contentType}`);

                if (contentType?.includes('dash')) {
                    console.log(`  → DASH format ❌ OTT Navigator won't play this`);
                } else if (contentType?.includes('m3u') || contentType?.includes('hls')) {
                    console.log(`  → HLS format ✅ OTT Navigator can play this`);
                } else if (contentType?.includes('mp2t') || contentType?.includes('mpeg')) {
                    console.log(`  → MPEG-TS ✅ OTT Navigator can play this`);
                }
            } catch (err) {
                console.log(`  Error checking: ${err.message}`);
            }
        }
        console.log('');
    }

    console.log('=== DIAGNOSIS ===');
    console.log('If all JIO streams are DASH format (.mpd or application/dash+xml),');
    console.log('they will NOT work in OTT Navigator because it only supports HLS/TS.');
    console.log('\nYesterday when it was working, there might have been:');
    console.log('  1. Different playlist with HLS streams');
    console.log('  2. Different source URLs');
    console.log('  3. A conversion happening somewhere');
}

checkStreamFormats().catch(console.error);
