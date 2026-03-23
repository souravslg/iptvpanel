import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read env
const env = readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() ||
    env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

// Get JioTV Server playlist
const { data: playlist } = await supabase
    .from('playlists')
    .select('id, name, total_channels')
    .eq('name', 'JioTV Server')
    .single();

console.log('Playlist:', playlist);

// Get sample of stream URLs
const { data: streams } = await supabase
    .from('streams')
    .select('id, name, url, category')
    .eq('playlist_id', playlist.id)
    .limit(5);

console.log('\nSample stream URLs:');
streams?.forEach(s => {
    console.log(`  ${s.name}: ${s.url}`);
});

// Test if a stream URL is reachable
console.log('\nTesting first stream URL...');
try {
    const res = await fetch(streams[0].url, { method: 'HEAD' });
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('Content-Type:', res.headers.get('content-type'));
} catch (e) {
    console.log('Fetch error:', e.message);
}
