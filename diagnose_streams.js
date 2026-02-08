import { supabase } from './lib/supabase.js';

async function diagnoseActiveStreams() {
    console.log('🔍 DIAGNOSING ACTIVE STREAMS TRACKING\n');
    console.log('='.repeat(60));

    try {
        // Check 1: Check if active_streams table has any data
        console.log('\n1️⃣ Checking active_streams table...');
        const { data: allStreams, error: allError } = await supabase
            .from('active_streams')
            .select('*');

        if (allError) {
            console.log('❌ Error querying active_streams:', allError.message);
        } else {
            console.log(`✅ Total records in active_streams: ${allStreams?.length || 0}`);
            if (allStreams && allStreams.length > 0) {
                console.log('\nRecent streams:');
                allStreams.slice(0, 5).forEach(stream => {
                    console.log(`  - User: ${stream.username}, Stream: ${stream.stream_id}, Last Ping: ${stream.last_ping}`);
                });
            }
        }

        // Check 2: Check active streams (last 5 minutes)
        console.log('\n2️⃣ Checking streams active in last 5 minutes...');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentStreams, error: recentError } = await supabase
            .from('active_streams')
            .select('*')
            .gte('last_ping', fiveMinutesAgo);

        if (recentError) {
            console.log('❌ Error:', recentError.message);
        } else {
            console.log(`✅ Active streams (last 5 min): ${recentStreams?.length || 0}`);
            if (recentStreams && recentStreams.length > 0) {
                recentStreams.forEach(stream => {
                    const duration = Math.floor((new Date() - new Date(stream.started_at)) / 1000);
                    console.log(`  - ${stream.username} watching ${stream.stream_name} for ${duration}s`);
                });
            }
        }

        // Check 3: Check users
        console.log('\n3️⃣ Checking active users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('status', 'Active');

        if (usersError) {
            console.log('❌ Error:', usersError.message);
        } else {
            console.log(`✅ Total active users: ${users?.length || 0}`);
            if (users && users.length > 0) {
                users.forEach(user => {
                    console.log(`  - ${user.username} (expires: ${user.expire_date})`);
                });
            }
        }

        // Check 4: Check streams/channels
        console.log('\n4️⃣ Checking available streams/channels...');
        const { data: streams, error: streamsError } = await supabase
            .from('streams')
            .select('*')
            .limit(5);

        if (streamsError) {
            console.log('❌ Error:', streamsError.message);
        } else {
            console.log(`✅ Total streams in database: ${streams?.length || 0}`);
            if (streams && streams.length > 0) {
                streams.forEach(stream => {
                    console.log(`  - ${stream.name} (ID: ${stream.stream_id || stream.id})`);
                });
            }
        }

        // Check 5: Test the API endpoint
        console.log('\n5️⃣ Testing /api/active-users endpoint...');
        console.log('   (This would need to be tested via HTTP request)');

        console.log('\n' + '='.repeat(60));
        console.log('\n📋 DIAGNOSIS SUMMARY:');
        console.log('   - Active streams table: ' + (allError ? '❌ ERROR' : '✅ EXISTS'));
        console.log('   - Records in table: ' + (allStreams?.length || 0));
        console.log('   - Active in last 5 min: ' + (recentStreams?.length || 0));
        console.log('   - Active users: ' + (users?.length || 0));
        console.log('   - Available channels: ' + (streams?.length || 0));

        console.log('\n💡 TROUBLESHOOTING TIPS:');
        if (!allStreams || allStreams.length === 0) {
            console.log('   ⚠️  No streams tracked yet. This means:');
            console.log('      1. Users haven\'t watched any channels through /live/ route yet');
            console.log('      2. OR the tracking code isn\'t being executed');
            console.log('      3. OR there\'s an error in the tracking code');
            console.log('\n   🔧 To test: Have a user watch a channel via the /live/ URL');
            console.log('      Example: http://localhost:3000/live/username/password/123.m3u8');
        }

        if (recentStreams && recentStreams.length === 0 && allStreams && allStreams.length > 0) {
            console.log('   ⚠️  Streams exist but none are recent (>5 min old)');
            console.log('      - Users stopped watching more than 5 minutes ago');
            console.log('      - Have users watch channels to see them appear');
        }

    } catch (error) {
        console.error('\n❌ UNEXPECTED ERROR:', error);
    }
}

diagnoseActiveStreams();
