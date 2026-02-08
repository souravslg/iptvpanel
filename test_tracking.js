// Test script to simulate a stream access and check if tracking works
import { supabase } from './lib/supabase.js';

async function testStreamTracking() {
    console.log('🧪 TESTING STREAM TRACKING\n');
    console.log('='.repeat(60));

    try {
        // Get a test user
        console.log('\n1️⃣ Getting test user...');
        const { data: users } = await supabase
            .from('users')
            .select('*')
            .eq('status', 'Active')
            .limit(1);

        if (!users || users.length === 0) {
            console.log('❌ No active users found');
            return;
        }

        const testUser = users[0];
        console.log(`✅ Using user: ${testUser.username}`);

        // Get a test stream
        console.log('\n2️⃣ Getting test stream...');
        const { data: streams } = await supabase
            .from('streams')
            .select('*')
            .limit(1);

        if (!streams || streams.length === 0) {
            console.log('❌ No streams found');
            return;
        }

        const testStream = streams[0];
        const streamId = testStream.stream_id || testStream.id;
        console.log(`✅ Using stream: ${testStream.name} (ID: ${streamId})`);

        // Simulate tracking
        console.log('\n3️⃣ Simulating stream tracking...');
        const trackingData = {
            user_id: testUser.id,
            username: testUser.username,
            stream_id: streamId.toString(),
            stream_name: testStream.name,
            user_agent: 'Test Script',
            ip_address: '127.0.0.1',
            started_at: new Date().toISOString(),
            last_ping: new Date().toISOString()
        };

        console.log('Inserting:', trackingData);

        const { data: insertData, error: insertError } = await supabase
            .from('active_streams')
            .insert(trackingData)
            .select();

        if (insertError) {
            console.error('❌ Insert failed:', insertError);
            console.error('Error code:', insertError.code);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
        } else {
            console.log('✅ Stream tracked successfully!');
            console.log('Inserted record:', insertData);
        }

        // Verify the insert
        console.log('\n4️⃣ Verifying insert...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('active_streams')
            .select('*')
            .eq('username', testUser.username);

        if (verifyError) {
            console.error('❌ Verification failed:', verifyError);
        } else {
            console.log(`✅ Found ${verifyData.length} active stream(s) for user ${testUser.username}`);
            verifyData.forEach(stream => {
                console.log(`   - ${stream.stream_name} (started: ${stream.started_at})`);
            });
        }

        // Test the API endpoint
        console.log('\n5️⃣ Testing API endpoint...');
        console.log('   You can test manually by visiting:');
        console.log('   http://localhost:3000/api/active-users');

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST COMPLETED');
        console.log('\nNow check the Active Users page to see if the stream appears!');
        console.log('The stream should show up for the next 5 minutes.');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

testStreamTracking();
