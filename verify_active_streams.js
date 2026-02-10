import { supabaseAdmin } from './lib/supabase-admin.js';

console.log('🔍 Verifying Active Streams Logging...\n');

async function verifyActiveStreams() {
    try {
        // 1. Check if table exists by trying to query it
        console.log('1️⃣  Checking if active_streams table exists...');
        const { data: tableCheck, error: tableError } = await supabaseAdmin
            .from('active_streams')
            .select('count')
            .limit(1);

        if (tableError) {
            if (tableError.code === 'PGRST116' || tableError.code === '42P01') {
                console.log('❌ Table does not exist!');
                console.log('   You need to create the active_streams table in Supabase');
                return;
            }
            console.log('⚠️  Error checking table:', tableError.message);
        } else {
            console.log('✅ Table exists\n');
        }

        // 2. Try to insert a test record
        console.log('2️⃣  Testing INSERT operation...');
        const testData = {
            username: 'test_user',
            stream_id: 'test_stream_123',
            stream_name: 'Test Channel',
            ip_address: '127.0.0.1',
            user_agent: 'Test Agent',
            started_at: new Date().toISOString(),
            last_ping: new Date().toISOString()
        };

        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('active_streams')
            .insert(testData)
            .select();

        if (insertError) {
            console.log('❌ INSERT failed:', insertError.message);
            console.log('   Code:', insertError.code);
            console.log('   Details:', insertError.details);
            console.log('   Hint:', insertError.hint);
        } else {
            console.log('✅ INSERT successful');
            console.log('   Inserted record:', insertData[0]);
        }

        // 3. Try to read current active streams
        console.log('\n3️⃣  Fetching current active streams (last 5 minutes)...');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: activeStreams, error: selectError } = await supabaseAdmin
            .from('active_streams')
            .select('*')
            .gte('last_ping', fiveMinutesAgo);

        if (selectError) {
            console.log('❌ SELECT failed:', selectError.message);
        } else {
            console.log(`✅ Found ${activeStreams.length} active stream(s)`);
            if (activeStreams.length > 0) {
                console.log('\n📺 Active Streams:');
                activeStreams.forEach((stream, idx) => {
                    console.log(`   ${idx + 1}. ${stream.stream_name} (${stream.username})`);
                    console.log(`      Stream ID: ${stream.stream_id}`);
                    console.log(`      IP: ${stream.ip_address}`);
                    console.log(`      Last Ping: ${stream.last_ping}`);
                });
            }
        }

        // 4. Clean up test record
        if (insertData && insertData[0]) {
            console.log('\n4️⃣  Cleaning up test record...');
            const { error: deleteError } = await supabaseAdmin
                .from('active_streams')
                .delete()
                .eq('username', 'test_user')
                .eq('stream_id', 'test_stream_123');

            if (deleteError) {
                console.log('❌ DELETE failed:', deleteError.message);
            } else {
                console.log('✅ Test record deleted');
            }
        }

        console.log('\n✅ Verification complete!');

    } catch (error) {
        console.error('❌ Verification failed with error:', error);
    }
}

verifyActiveStreams();
