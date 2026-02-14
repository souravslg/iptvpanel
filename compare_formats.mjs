// Compare M3U format vs Xtream API format
import { supabase } from './lib/supabase.js';

async function compareFormats() {
    console.log('=== COMPARING M3U vs XTREAM API FORMAT ===\n');

    // Get a JTV stream from database
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Vande Gujarat%')
        .limit(1)
        .single();

    if (!stream) {
        console.log('No stream found');
        return;
    }

    console.log('Stream from Database:');
    console.log('  Name:', stream.name);
    console.log('  URL:', stream.url);
    console.log('  Format:', stream.stream_format);
    console.log('  DRM Scheme:', stream.drm_scheme);
    console.log('  DRM Key ID:', stream.drm_key_id);
    console.log('  DRM Key:', stream.drm_key);
    console.log('');

    // What Xtream API would return
    console.log('What Xtream API Returns:');
    console.log(JSON.stringify({
        "direct_source": "https://iptvpanel.vercel.app/live/home2/home2/1069.mpd",
        "container_extension": "mpd",
        "drm_scheme": "clearkey",
        "drm_key_id": stream.drm_key_id,
        "drm_key": stream.drm_key
    }, null, 2));

    console.log('\n--- POTENTIAL ISSUES ---');
    console.log('1. Does OTT Navigator support clearkey DRM via Xtream?');
    console.log('2. Is the proxy URL accessible from OTT Navigator?');
    console.log('3. Are DRM keys in the correct format (HEX)?');
    console.log('4. Does container_extension need to match the actual stream type?');

    process.exit(0);
}

compareFormats().catch(console.error);
