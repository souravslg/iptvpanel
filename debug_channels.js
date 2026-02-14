const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugChannels() {
    console.log('=== Debugging Channel Loading ===\n');

    // 1. Check user credentials
    console.log('1. Checking user credentials...');
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', '22')
        .eq('password', '22')
        .single();

    if (userError) {
        console.log('❌ User error:', userError.message);
        return;
    }

    console.log(`✅ User found: ${user.username} (Status: ${user.status})`);
    console.log(`   Expire Date: ${user.expire_date}`);

    const expireDate = new Date(user.expire_date);
    const now = new Date();
    const isExpired = expireDate < now;
    console.log(`   Is Expired: ${isExpired ? '❌ YES' : '✅ NO'}\n`);

    // 2. Check active playlists
    console.log('2. Checking active playlists...');
    const { data: playlists, error: playlistError } = await supabase
        .from('playlists')
        .select('id, name, is_active, source_url')
        .eq('is_active', true);

    if (playlistError) {
        console.log('❌ Playlist error:', playlistError.message);
        return;
    }

    if (!playlists || playlists.length === 0) {
        console.log('❌ NO ACTIVE PLAYLISTS FOUND!\n');
        return;
    }

    console.log(`✅ Found ${playlists.length} active playlist(s):`);
    playlists.forEach(p => {
        console.log(`   - Playlist ${p.id}: ${p.name}`);
        console.log(`     Source: ${p.source_url?.substring(0, 60)}...`);
    });
    console.log('');

    // 3. Count streams in active playlists
    console.log('3. Checking streams...');
    const playlistIds = playlists.map(p => p.id);
    const { data: streams, count, error: streamError } = await supabase
        .from('streams')
        .select('*', { count: 'exact' })
        .in('playlist_id', playlistIds)
        .limit(3);

    if (streamError) {
        console.log('❌ Stream error:', streamError.message);
        return;
    }

    console.log(`✅ Total streams in active playlists: ${count}`);
    if (streams && streams.length > 0) {
        console.log('   Sample streams:');
        streams.forEach((s, idx) => {
            console.log(`   ${idx + 1}. ${s.name} (ID: ${s.stream_id})`);
        });
    } else {
        console.log('   ❌ NO STREAMS FOUND!');
    }
    console.log('');

    // 4. Check stream mode
    console.log('4. Checking stream mode...');
    const { data: modeData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();

    const streamMode = modeData?.value || 'proxy';
    console.log(`✅ Stream Mode: ${streamMode}\n`);

    // 5. Test API endpoints
    console.log('5. Testing API endpoints...');
    console.log('   Try these URLs:');
    console.log('   Player API: http://localhost:3000/api/player_api?username=22&password=22&action=get_live_streams');
    console.log('   M3U URL: http://localhost:3000/api/get?username=22&password=22');
    if (streams && streams.length > 0) {
        const testStream = streams[0];
        console.log(`   Test Stream: http://localhost:3000/live/22/22/${testStream.stream_id}.ts`);
    }
    console.log('');

    // Summary
    console.log('=== DIAGNOSTIC SUMMARY ===');
    if (isExpired) {
        console.log('⚠️ WARNING: User account is EXPIRED!');
    }
    if (!playlists || playlists.length === 0) {
        console.log('❌ CRITICAL: No active playlists');
    } else if (count === 0) {
        console.log('❌ CRITICAL: No streams in active playlists');
    } else {
        console.log('✅ Database configuration looks correct');
        console.log('   Next: Check if dev server is running on port 3000');
        console.log('   Try accessing the API URLs above in a browser or player');
    }
}

debugChannels().catch(console.error);
