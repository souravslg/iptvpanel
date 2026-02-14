// Check JTV auto-generated streams
import { supabase } from './lib/supabase.js';

async function checkJTVStreams() {
    console.log('Checking JTV Auto-Generated Streams\n');

    // Get active playlists
    const { data: playlists } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_active', true);

    console.log('Active Playlists:', playlists?.map(p => `${p.name} (id: ${p.id})`).join(', '));

    // Get JTV streams
    const { data: jtvStreams } = await supabase
        .from('streams')
        .select('*')
        .ilike('url', '%jio%')
        .limit(5);

    console.log('\n=== JTV STREAMS ===\n');
    jtvStreams?.forEach(stream => {
        console.log('-----------------------------------');
        console.log('Name:', stream.name);
        console.log('Stream ID:', stream.stream_id);
        console.log('URL:', stream.url);
        console.log('Format:', stream.stream_format);
        console.log('Type:', stream.type);
        console.log('Enabled:', stream.enabled);
        console.log('Playlist ID:', stream.playlist_id);

        if (stream.headers) {
            const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            console.log('Headers:', Object.keys(headers).join(', '));
            console.log('Has Cookie:', Object.keys(headers).some(k => k.toLowerCase() === 'cookie'));
        } else {
            console.log('Headers: null');
        }

        console.log('DRM Scheme:', stream.drm_scheme);
        console.log('DRM Key ID:', stream.drm_key_id?.substring(0, 20) + '...');
        console.log('DRM Key:', stream.drm_key?.substring(0, 20) + '...');
        console.log('');
    });

    process.exit(0);
}

checkJTVStreams().catch(console.error);
