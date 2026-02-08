const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('=== PLAYLIST DIAGNOSIS ===\n');

    // Get all playlists
    const { data: playlists, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

    if (playlistError) {
        console.error('Error fetching playlists:', playlistError);
        return;
    }

    console.log(`Total playlists: ${playlists?.length || 0}\n`);

    for (const playlist of playlists || []) {
        console.log(`Playlist: ${playlist.name}`);
        console.log(`  ID: ${playlist.id}`);
        console.log(`  Active: ${playlist.is_active ? 'YES ✓' : 'NO'}`);
        console.log(`  Created: ${playlist.created_at}`);
        console.log(`  Updated: ${playlist.updated_at}`);

        // Count streams in this playlist
        const { count, error: countError } = await supabase
            .from('streams')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);

        if (!countError) {
            console.log(`  Streams: ${count || 0}`);
        }
        console.log('');
    }

    // Check for streams without playlist_id
    const { count: orphanCount, error: orphanError } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true })
        .is('playlist_id', null);

    if (!orphanError && orphanCount > 0) {
        console.log(`⚠️  WARNING: ${orphanCount} streams have no playlist_id (orphaned streams)\n`);
    }

    // Get total streams
    const { count: totalStreams, error: totalError } = await supabase
        .from('streams')
        .select('*', { count: 'exact', head: true });

    if (!totalError) {
        console.log(`Total streams in database: ${totalStreams || 0}\n`);
    }

    // Check what the API would return
    const { data: activePlaylists } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('is_active', true);

    console.log('=== WHAT USERS WILL SEE ===');
    console.log(`Active playlists: ${activePlaylists?.length || 0}`);
    if (activePlaylists && activePlaylists.length > 0) {
        for (const ap of activePlaylists) {
            console.log(`  - ${ap.name} (ID: ${ap.id})`);
        }
    } else {
        console.log('  ⚠️  NO ACTIVE PLAYLISTS!');
    }
}

diagnose().catch(console.error);
