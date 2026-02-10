import { supabaseAdmin } from './lib/supabase-admin.js';

console.log('🧪 Testing INSERT to active_streams table...\n');

async function testInsert() {
    try {
        const username = '12';
        const streamData = {
            username: username,
            stream_id: '1357',
            stream_name: 'Star Sports 1 Tamil',
            ip_address: '127.0.0.1',
            user_agent: 'Test Agent',
            last_ping: new Date().toISOString(),
            started_at: new Date().toISOString()
        };

        console.log('Attempting to insert:', streamData);
        console.log('');

        const { data, error } = await supabaseAdmin
            .from('active_streams')
            .insert(streamData)
            .select();

        if (error) {
            console.log('❌ INSERT FAILED!');
            console.log('   Error Message:', error.message);
            console.log('   Error Code:', error.code);
            console.log('   Error Details:', error.details);
            console.log('   Error Hint:', error.hint);
        } else {
            console.log('✅ INSERT SUCCESS!');
            console.log('   Inserted Record:', data[0]);

            // Clean up
            console.log('\nCleaning up test record...');
            await supabaseAdmin
                .from('active_streams')
                .delete()
                .eq('username', username)
                .eq('stream_id', '1357');
            console.log('✅ Cleaned up');
        }

    } catch (error) {
        console.error('❌ Exception:', error);
    }
}

testInsert();
