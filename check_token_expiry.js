const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokenIssue() {
    console.log('=== Checking Token Issue ===\n');

    // Get a JIO stream from database
    const { data: streams } = await supabase
        .from('streams')
        .select('stream_id, name, url')
        .in('playlist_id', [44])
        .limit(1);

    if (!streams || streams.length === 0) {
        console.log('❌ No streams found');
        return;
    }

    const stream = streams[0];
    console.log(`Sample Stream: ${stream.name}`);
    console.log(`Database URL: ${stream.url}\n`);

    // Check if URL has token
    if (stream.url.includes('hdnts=')) {
        const tokenMatch = stream.url.match(/hdnts=([^&]+)/);
        if (tokenMatch) {
            const token = tokenMatch[1];
            console.log(`Token found in URL: ${token.substring(0, 30)}...`);

            // Try to decode token to check expiration (if it's a timestamp)
            try {
                // JIO tokens often have timestamp encoded
                const tsMatch = token.match(/exp=(\d+)/);
                if (tsMatch) {
                    const expTime = parseInt(tsMatch[1]);
                    const now = Math.floor(Date.now() / 1000);
                    const diff = expTime - now;
                    console.log(`Token expires in: ${diff} seconds`);
                    if (diff < 0) {
                        console.log(`❌ TOKEN IS EXPIRED!`);
                    } else if (diff < 3600) {
                        console.log(`⚠️ Token expires soon (< 1 hour)`);
                    } else {
                        console.log(`✅ Token still valid`);
                    }
                }
            } catch (e) { }
        }
    } else {
        console.log('⚠️ No hdnts token in database URL');
    }

    // Test if the URL actually works
    console.log(`\nTesting URL accessibility...`);
    try {
        const response = await fetch(stream.url, {
            headers: {
                'User-Agent': 'plaYtv/7.1.3 (Linux;Android 13) ygx/824.1 ExoPlayerLib/2.4.0'
            }
        });
        console.log(`Direct access status: ${response.status}`);

        if (response.status === 403 || response.status === 451) {
            console.log(`❌ ACCESS DENIED - Token may be expired or invalid`);
        } else if (response.status === 200) {
            console.log(`✅ URL is accessible`);
        }
    } catch (err) {
        console.log(`❌ Error: ${err.message}`);
    }

    console.log(`\n=== DIAGNOSIS ===`);
    console.log(`JIO streams use dynamic tokens that expire quickly (minutes/hours).`);
    console.log(`The URLs in your database are likely static/old and won't work.`);
    console.log(`\nThis is why it stopped working:`);
    console.log(`  - When playlist was imported, URLs had valid tokens`);
    console.log(`  - Tokens expired after some time`);
    console.log(`  - Now redirect leads to expired URLs → 403/451 errors`);
    console.log(`\nSOLUTION: Need dynamic token generation or refresh playlist frequently`);
}

checkTokenIssue().catch(console.error);
