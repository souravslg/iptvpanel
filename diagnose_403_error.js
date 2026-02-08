const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose403Error() {
    console.log('=== DIAGNOSING 403 ACCESS DENIED ERROR ===\n');

    // Get active playlists
    const { data: activePlaylists } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('is_active', true);

    if (!activePlaylists || activePlaylists.length === 0) {
        console.log('❌ No active playlists found!');
        return;
    }

    const playlistIds = activePlaylists.map(p => p.id);
    console.log(`Active playlists: ${activePlaylists.map(p => p.name).join(', ')}\n`);

    // Check for DRM-protected streams
    const { data: drmStreams, error: drmError } = await supabase
        .from('streams')
        .select('id, name, url, drm_scheme, drm_license_url, drm_key_id, drm_key')
        .in('playlist_id', playlistIds)
        .not('drm_scheme', 'is', null);

    console.log(`DRM-protected streams in active playlists: ${drmStreams?.length || 0}`);

    if (drmStreams && drmStreams.length > 0) {
        console.log('\n📋 DRM Streams Found:');
        drmStreams.slice(0, 10).forEach((stream, i) => {
            console.log(`\n${i + 1}. ${stream.name}`);
            console.log(`   ID: ${stream.id}`);
            console.log(`   DRM Scheme: ${stream.drm_scheme}`);
            console.log(`   License URL: ${stream.drm_license_url ? 'Yes' : 'No'}`);
            console.log(`   Key ID: ${stream.drm_key_id ? 'Yes' : 'No'}`);
            console.log(`   Key: ${stream.drm_key ? 'Yes' : 'No'}`);
        });
    }

    // Check for streams with problematic URLs
    const { data: allStreams } = await supabase
        .from('streams')
        .select('id, name, url')
        .in('playlist_id', playlistIds)
        .limit(1000);

    console.log(`\n\n=== URL ANALYSIS ===`);
    console.log(`Total streams checked: ${allStreams?.length || 0}\n`);

    const urlPatterns = {
        'DRM Protected (widevine/clearkey)': 0,
        'Requires Authentication': 0,
        'Direct Stream': 0,
        'Empty/Invalid': 0
    };

    allStreams?.forEach(stream => {
        if (!stream.url || stream.url.trim() === '') {
            urlPatterns['Empty/Invalid']++;
        } else if (stream.url.includes('drm') || stream.url.includes('widevine') || stream.url.includes('clearkey')) {
            urlPatterns['DRM Protected (widevine/clearkey)']++;
        } else if (stream.url.includes('token=') || stream.url.includes('key=') || stream.url.includes('auth=')) {
            urlPatterns['Requires Authentication']++;
        } else {
            urlPatterns['Direct Stream']++;
        }
    });

    console.log('URL Types:');
    Object.entries(urlPatterns).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    console.log('\n\n=== COMMON CAUSES OF 403 ERRORS ===\n');
    console.log('1. DRM-Protected Streams');
    console.log('   - Stream requires Widevine/PlayReady/ClearKey');
    console.log('   - Your panel redirects to stream URL');
    console.log('   - Player doesn\'t have valid DRM keys');
    console.log('   - Solution: Ensure DRM info is in M3U or use DRM-capable player\n');

    console.log('2. Token/Key Expired');
    console.log('   - Stream URL has authentication token');
    console.log('   - Token expired or invalid');
    console.log('   - Solution: Update playlist with fresh URLs\n');

    console.log('3. IP/Geo Restrictions');
    console.log('   - Stream source blocks certain IPs/countries');
    console.log('   - Your server IP might be blocked');
    console.log('   - Solution: Use VPN or proxy\n');

    console.log('4. Referrer/User-Agent Check');
    console.log('   - Stream source checks HTTP headers');
    console.log('   - Missing or wrong headers');
    console.log('   - Solution: Proxy stream through your server\n');

    console.log('\n=== RECOMMENDED ACTIONS ===\n');

    if (drmStreams && drmStreams.length > 0) {
        console.log('⚠️  You have DRM-protected streams!');
        console.log('   - These require special handling');
        console.log('   - OTT Navigator supports DRM if configured correctly');
        console.log('   - Ensure DRM info is included in M3U playlist\n');
    }

    if (urlPatterns['Requires Authentication'] > 0) {
        console.log('⚠️  Some streams have authentication tokens');
        console.log('   - These tokens may expire');
        console.log('   - Update playlist regularly');
        console.log('   - Or use stream proxy to handle authentication\n');
    }

    console.log('✅ Next Steps:');
    console.log('   1. Check which specific stream is giving 403 error');
    console.log('   2. Test that stream URL directly in browser');
    console.log('   3. Check if stream requires DRM or authentication');
    console.log('   4. Update stream URL if token expired');
    console.log('   5. Consider using stream proxy for problematic streams');
}

diagnose403Error().catch(console.error);
