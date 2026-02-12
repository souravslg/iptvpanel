// Quick diagnostic script
async function diagnoseXtreamIssue() {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check user 22
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', '22')
        .eq('password', '22')
        .single();

    console.log('\n=== USER 22 ===');
    if (userError) {
        console.log('Error:', userError.message);
    } else {
        console.log('Found user:', user?.username, 'Status:', user?.status);
        console.log('Expires:', user?.expire_date);
    }

    // Check active playlists
    const { data: playlists } = await supabase
        .from('playlists')
        .select('id, name, is_active')
        .eq('is_active', true);

    console.log('\n=== ACTIVE PLAYLISTS ===');
    console.log(playlists);

    if (playlists && playlists.length > 0) {
        const playlistIds = playlists.map(p => p.id);

        // Count streams
        const { count } = await supabase
            .from('streams')
            .select('*', { count: 'exact', head: true })
            .in('playlist_id', playlistIds);

        console.log('\n=== STREAMS IN ACTIVE PLAYLISTS ===');
        console.log('Total streams:', count);

        // Sample streams
        const { data: samples } = await supabase
            .from('streams')
            .select('id, stream_id, name, url')
            .in('playlist_id', playlistIds)
            .limit(3);

        console.log('\nSample streams:');
        console.log(samples);
    }
}

diagnoseXtreamIssue().catch(console.error);
