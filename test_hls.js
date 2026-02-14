const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHlsConversion() {
    console.log('=== Testing HLS (.m3u8) Conversion ===\n');

    // Get a sample stream
    const { data: streams } = await supabase
        .from('streams')
        .select('name, url')
        .eq('playlist_id', 30)
        .limit(1);

    if (!streams || streams.length === 0) {
        console.log('❌ No streams found');
        return;
    }

    const stream = streams[0];
    const mpdUrl = stream.url;
    console.log(`Original MPD URL: ${mpdUrl}`);

    // Try converting to m3u8
    // Simple replacement: .mpd -> .m3u8
    // Also usually 'dash' path segment might need changing to 'hls'?
    // Hotstar/Jio patterns: /dash/ -> /hls/ ? or just extension?

    const hlsUrl1 = mpdUrl.replace('.mpd', '.m3u8');
    const hlsUrl2 = mpdUrl.replace('/dash/', '/hls/').replace('.mpd', '.m3u8');

    console.log(`\nTest 1 (Ext only): ${hlsUrl1}`);
    await checkUrl(hlsUrl1);

    console.log(`\nTest 2 (Path + Ext): ${hlsUrl2}`);
    await checkUrl(hlsUrl2);
}

async function checkUrl(url) {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);

        // Use Headers from a typical player
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0',
            }
        });
        clearTimeout(id);

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.ok || response.status === 403) {
            // 403 means it exists but needs auth/token, which is promising for existence
            console.log('✅ URL format appears valid (server responded)');
        } else {
            console.log('❌ URL likely invalid (404 etc)');
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testHlsConversion().catch(console.error);
