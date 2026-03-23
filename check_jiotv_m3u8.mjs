import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() ||
    env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

const { data: playlist } = await supabase
    .from('playlists').select('id').eq('name', 'JioTV Server').single();

const { data: streams } = await supabase
    .from('streams').select('name,url,drm_scheme,drm_key_id,drm_key')
    .eq('playlist_id', playlist.id).limit(3);

for (const s of streams) {
    console.log(`\n=== ${s.name} ===`);
    console.log(`URL: ${s.url}`);
    console.log(`DRM scheme: ${s.drm_scheme}`);
    console.log(`DRM key_id: ${s.drm_key_id}`);
    console.log(`DRM key: ${s.drm_key}`);

    // Fetch the m3u8 directly to see what DRM tags it has
    try {
        const res = await fetch(s.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(10000)
        });
        console.log(`HTTP status: ${res.status}`);
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n').slice(0, 30);
            console.log('M3U8 content (first 30 lines):');
            lines.forEach(l => console.log(l));
        } else {
            console.log(`Error: ${res.status} ${res.statusText}`);
        }
    } catch (e) {
        console.log(`Fetch error: ${e.message}`);
    }
    break; // Just check first stream
}
