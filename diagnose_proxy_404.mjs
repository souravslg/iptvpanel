// Diagnostic script to understand proxy 404 issue
async function diagnoseProxy() {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== Proxy 404 Diagnostic ===\n');

    // Get active playlists
    const { data: playlists } = await supabase
        .from('playlists')
        .select('id, name')
        .eq('is_active', true);

    console.log('Active playlists:', playlists);

    if (!playlists || playlists.length === 0) {
        console.log('❌ No active playlists found!');
        return;
    }

    const playlistIds = playlists.map(p => p.id);

    // Get sample streams
    const { data: streams, error } = await supabase
        .from('streams')
        .select('id, stream_id, name, url, playlist_id')
        .in('playlist_id', playlistIds)
        .limit(5);

    console.log('\nSample streams from active playlists:');
    if (error) {
        console.error('Error:', error);
    } else {
        streams.forEach(s => {
            console.log(`\nStream:`);
            console.log(`  id: ${s.id} (type: ${typeof s.id})`);
            console.log(`  stream_id: ${s.stream_id} (type: ${typeof s.stream_id})`);
            console.log(`  name: ${s.name}`);
            console.log(`  playlist_id: ${s.playlist_id}`);
            console.log(`  has URL: ${!!s.url}`);
        });

        // Test proxy lookup logic
        if (streams.length > 0) {
            const testStream = streams[0];
            const testId = testStream.stream_id || testStream.id;

            console.log(`\n=== Testing Proxy Lookup Logic ===`);
            console.log(`Test stream_id: "${testId}" (type: ${typeof testId})`);

            const isNumeric = /^\d+$/.test(String(testId));
            console.log(`Is numeric: ${isNumeric}`);

            // Simulate the proxy query
            let query = supabase.from('streams').select('*').in('playlist_id', playlistIds);

            if (isNumeric) {
                console.log(`Query: OR (id=${testId} OR stream_id=${testId})`);
                query = query.or(`id.eq.${testId},stream_id.eq.${testId}`);
            } else {
                console.log(`Query: stream_id=${testId}`);
                query = query.eq('stream_id', testId);
            }

            const { data: result, error: queryError } = await query;

            if (queryError) {
                console.log('❌ Query error:', queryError);
            } else if (!result || result.length === 0) {
                console.log('❌ No results found - THIS IS THE PROBLEM!');
            } else {
                console.log('✅ Found stream:', result[0].name);
            }
        }
    }
}

diagnoseProxy().catch(console.error);
