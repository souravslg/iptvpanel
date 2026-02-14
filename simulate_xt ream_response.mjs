// Simulate exact Xtream API response for JTV streams
import { supabase } from './lib/supabase.js';

async function simulateXtreamResponse() {
    console.log('=== SIMULATING XTREAM API RESPONSE ===\n');

    // Get JTV stream
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .ilike('url', '%jio%')
        .limit(1)
        .single();

    if (!streams) {
        console.log('No JTV stream found');
        return;
    }

    const stream = streams;
    const streamId = stream.stream_id || stream.id;

    console.log('Stream:', stream.name);
    console.log('ID:', streamId);
    console.log('\n--- WHAT OTT NAVIGATOR RECEIVES ---\n');

    // Simulate player_api logic
    let needsCookie = false;
    if (stream.headers) {
        const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        needsCookie = Object.keys(headers).some(key => key.toLowerCase() === 'cookie');
    }

    let extension = 'ts';
    if (stream.stream_format === 'mpd' || stream.stream_format === 'dash') {
        extension = 'mpd';
    } else if (stream.stream_format === 'm3u8' || stream.stream_format === 'hls') {
        extension = 'm3u8';
    }

    const directSource = needsCookie
        ? `https://yourserver.com/live/testuser/testpass/${streamId}.${extension}`
        : stream.url;

    const response = {
        num: stream.id,
        name: stream.name,
        title: stream.name,
        stream_type: stream.type || 'live',
        stream_id: streamId,
        stream_icon: stream.logo || '',
        epg_channel_id: null,
        added: Math.floor(new Date(stream.created_at).getTime() / 1000).toString(),
        category_id: '1',
        custom_sid: '',
        tv_archive: 0,
        direct_source: directSource,
        tv_archive_duration: 0,
        container_extension: extension
    };

    // Add DRM if present
    if (stream.drm_scheme) {
        response.drm_scheme = stream.drm_scheme;
        if (stream.drm_license_url) response.drm_license_url = stream.drm_license_url;
        if (stream.drm_key_id) response.drm_key_id = stream.drm_key_id;
        if (stream.drm_key) response.drm_key = stream.drm_key;
    }

    console.log(JSON.stringify(response, null, 2));

    console.log('\n--- ANALYSIS ---');
    console.log('Uses Proxy:', needsCookie);
    console.log('Extension:', extension);
    console.log('Has DRM:', !!stream.drm_scheme);
    console.log('DRM Scheme:', stream.drm_scheme);
    console.log('Key ID format:', stream.drm_key_id ? 'HEX' : 'N/A');
    console.log('Key format:', stream.drm_key ? 'HEX' : 'N/A');

    process.exit(0);
}

simulateXtreamResponse().catch(console.error);
