import { supabaseAdmin } from './lib/supabase-admin.js';

console.log('🔍 Checking for real active streams in database...\n');

async function checkActiveStreams() {
    try {
        // Fetch current active streams (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        console.log(`Querying streams with last_ping >= ${fiveMinutesAgo}\n`);

        const { data: activeStreams, error: selectError } = await supabaseAdmin
            .from('active_streams')
            .select('*')
            .gte('last_ping', fiveMinutesAgo);

        if (selectError) {
            console.log('❌ Query failed:', selectError.message);
            return;
        }

        console.log(`Found ${activeStreams.length} active stream(s)\n`);

        if (activeStreams.length > 0) {
            console.log('📺 Active Streams:');
            activeStreams.forEach((stream, idx) => {
                console.log(`\n   ${idx + 1}. ${stream.stream_name || 'NO NAME'}`);
                console.log(`      Username: ${stream.username}`);
                console.log(`      Stream ID: ${stream.stream_id}`);
                console.log(`      IP: ${stream.ip_address}`);
                console.log(`      Started: ${stream.started_at}`);
                console.log(`      Last Ping: ${stream.last_ping}`);
                console.log(`      ID: ${stream.id}`);
            });
        } else {
            console.log('⚠️  No active streams found. This could mean:');
            console.log('   1. No streams have been accessed recently');
            console.log('   2. Stream logging is failing silently');
            console.log('   3. Streams are being inserted but immediately cleaned up');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkActiveStreams();
