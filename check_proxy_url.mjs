// Check exact URL that would be returned to OTT Navigator
import { supabase } from './lib/supabase.js';

async function checkProxyURL() {
    console.log('=== CHECKING PROXY URL FORMAT ===\n');

    // Get a JTV stream
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .ilike('url', '%jio%')
        .limit(1)
        .single();

    if (!stream) {
        console.log('No JTV stream found');
        return;
    }

    // Simulate player_api response
    const username = 'home2';
    const password = 'home2';
    const streamId = stream.stream_id || stream.id;

    // Check if needs proxy
    let needsProxy = false;
    if (stream.headers) {
        const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        needsProxy = Object.keys(headers).some(key => key.toLowerCase() === 'cookie');
    }

    let extension = 'ts';
    if (stream.stream_format === 'mpd' || stream.stream_format === 'dash') {
        extension = 'mpd';
    } else if (stream.stream_format === 'm3u8' || stream.stream_format === 'hls') {
        extension = 'm3u8';
    }

    console.log('Stream:', stream.name);
    console.log('Stream ID:', streamId);
    console.log('Format:', stream.stream_format);
    console.log('Extension:', extension);
    console.log('Needs Proxy:', needsProxy);
    console.log('');

    if (needsProxy) {
        // This is what OTT Navigator would receive
        const localURL = `http://localhost:3000/live/${username}/${password}/${streamId}.${extension}`;
        const productionURL = `https://iptvpanel.vercel.app/live/${username}/${password}/${streamId}.${extension}`;

        console.log('LOCAL PROXY URL:');
        console.log(localURL);
        console.log('');
        console.log('PRODUCTION PROXY URL:');
        console.log(productionURL);
        console.log('');
        console.log('⚠️  OTT Navigator will try to play this URL');
        console.log('⚠️  The /live route must inject cookies and return the stream');
    } else {
        console.log('DIRECT URL (with pipe headers):');
        console.log(stream.url);
    }

    console.log('\n--- WHAT OTT NAVIGATOR SEES ---');
    const response = {
        "direct_source": needsProxy
            ? `https://iptvpanel.vercel.app/live/${username}/${password}/${streamId}.${extension}`
            : stream.url,
        "container_extension": extension,
        "drm_scheme": stream.drm_scheme || null,
        "drm_key_id": stream.drm_key_id || null,
        "drm_key": stream.drm_key || null
    };

    console.log(JSON.stringify(response, null, 2));

    process.exit(0);
}

checkProxyURL().catch(console.error);
