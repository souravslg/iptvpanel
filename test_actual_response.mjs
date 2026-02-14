// Test actual Xtream API response
import { supabase } from './lib/supabase.js';

async function testXtreamResponse() {
    console.log('=== TESTING ACTUAL XTREAM API RESPONSE ===\n');

    // Get a JTV stream
    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Vande Gujarat 1%')
        .limit(1)
        .single();

    if (!stream) {
        console.log('No stream found');
        return;
    }

    console.log('Stream from DB:');
    console.log('  Name:', stream.name);
    console.log('  URL:', stream.url);
    console.log('  Format:', stream.stream_format);
    console.log('  Has Headers:', !!stream.headers);

    if (stream.headers) {
        const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        console.log('  Headers:', Object.keys(headers));
        console.log('  Has Cookie:', Object.keys(headers).some(k => k.toLowerCase() === 'cookie'));
    }

    console.log('\n--- WHAT XTREAM API SHOULD RETURN ---\n');

    // Simulate smart proxy logic
    const streamId = stream.stream_id || stream.id;
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

    const directSource = needsProxy
        ? `http://localhost:3000/live/home2/home2/${streamId}.${extension}`
        : stream.url;

    const response = {
        "num": stream.id,
        "name": stream.name,
        "stream_id": streamId,
        "stream_type": "live",
        "container_extension": extension,
        "direct_source": directSource,
        "drm_scheme": stream.drm_scheme || null,
        "drm_key_id": stream.drm_key_id || null,
        "drm_key": stream.drm_key || null
    };

    console.log(JSON.stringify(response, null, 2));

    console.log('\n--- ANALYSIS ---');
    console.log('Uses Proxy:', needsProxy);
    console.log('Extension:', extension);
    console.log('Proxy URL:', needsProxy ? directSource : 'N/A');
    console.log('');
    console.log('OTT Navigator will try to play:', directSource);

    if (needsProxy) {
        console.log('\n⚠️  PROXY MUST:');
        console.log('  1. Authenticate user (home2/home2)');
        console.log('  2. Fetch stream from DB using stream ID');
        console.log('  3. Inject cookies from stream.headers');
        console.log('  4. Proxy the actual JTV URL:', stream.url);
    }

    process.exit(0);
}

testXtreamResponse().catch(console.error);
