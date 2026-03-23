import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() ||
    env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

const { data: playlist } = await supabase
    .from('playlists').select('id,name').eq('name', 'JioTV Server').single();
console.log('Playlist:', playlist);

// Check DRM fields
const { data: streams } = await supabase
    .from('streams').select('id,name,url,stream_format,drm_scheme,drm_license_url,drm_key_id,drm_key,headers')
    .eq('playlist_id', playlist.id).limit(5);

console.log('\n--- Sample Streams ---');
streams?.forEach(s => {
    console.log(`\nName: ${s.name}`);
    console.log(`URL: ${s.url}`);
    console.log(`Format: ${s.stream_format}`);
    console.log(`DRM Scheme: ${s.drm_scheme}`);
    console.log(`DRM License: ${s.drm_license_url}`);
    console.log(`DRM Key ID: ${s.drm_key_id}`);
    console.log(`DRM Key: ${s.drm_key}`);
    console.log(`Headers: ${JSON.stringify(s.headers)}`);
});

// Also fetch raw M3U and show first few channel lines including DRM tags
console.log('\n--- Raw M3U Sample (first 60 lines) ---');
try {
    const res = await fetch('https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u');
    const text = await res.text();
    const lines = text.split('\n').slice(0, 80);
    lines.forEach(l => console.log(l));
} catch (e) {
    console.log('Error fetching M3U:', e.message);
}
