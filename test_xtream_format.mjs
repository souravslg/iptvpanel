// Test Xtream API response format
import { supabase } from './lib/supabase.js';

async function testXtreamResponse() {
    console.log('Testing Xtream API Response Format\n');

    // Get a sample stream
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .eq('enabled', true)
        .limit(3);

    if (!streams || streams.length === 0) {
        console.log('No streams found');
        return;
    }

    // Get active playlists
    const { data: playlists } = await supabase
        .from('playlists')
        .select('id')
        .eq('is_active', true);

    const playlistIds = playlists?.map(p => p.id) || [];

    // Simulate what player_api returns
    streams.forEach(stream => {
        console.log('\n-----------------------------------');
        console.log('Stream:', stream.name);
        console.log('URL:', stream.url);
        console.log('Format:', stream.stream_format);
        console.log('Type:', stream.type);
        console.log('Headers:', stream.headers);
        console.log('DRM Scheme:', stream.drm_scheme);
        console.log('DRM Key ID:', stream.drm_key_id);
        console.log('DRM Key:', stream.drm_key);

        // Check extension
        let extension = 'ts';
        if (stream.stream_format === 'mpd') extension = 'mpd';
        else if (stream.stream_format === 'm3u8') extension = 'm3u8';

        // Check if needs proxy
        let needsCookie = false;
        if (stream.headers) {
            const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            needsCookie = Object.keys(headers).some(key => key.toLowerCase() === 'cookie');
        }

        console.log('\nWould return:');
        console.log('  Extension:', extension);
        console.log('  Needs Proxy:', needsCookie);
        console.log('  Direct Source:', needsCookie ? 'PROXY_URL' : stream.url);
    });

    process.exit(0);
}

testXtreamResponse().catch(console.error);
