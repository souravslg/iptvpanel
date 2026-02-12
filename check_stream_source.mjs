// Check where Xtream users get their streams vs JTV
async function checkStreamSource() {
    const { createClient } = await import('@supabase/supabase-js');
    const fs = await import('fs');
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
    const supabase = createClient(url, key);

    console.log('=== Checking Stream Sources ===\n');

    // Get active playlists
    const { data: playlists } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('is_active', true);

    console.log('Active playlists:', playlists);

    if (playlists && playlists.length > 0) {
        const playlistIds = playlists.map(p => p.id);

        // Get sample streams
        const { data: streams } = await supabase
            .from('streams')
            .select('id, stream_id, name, url')
            .in('playlist_id', playlistIds)
            .limit(3);

        console.log('\nSample streams in database:');
        streams?.forEach(s => {
            console.log(`\n  ${s.name}`);
            console.log(`  URL: ${s.url?.substring(0, 100)}...`);
        });
    }

    // Check JTV setting
    const { data: jtvSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'jtv_playlist')
        .single();

    console.log('\n\nJTV Playlist source:');
    console.log(jtvSetting?.value?.substring(0, 200) + '...');

    console.log('\n\n=== QUESTION ===');
    console.log('Does the Xtream API need to pull from the JTV source?');
    console.log('Or are they separate stream sources?');
}

checkStreamSource().catch(console.error);
