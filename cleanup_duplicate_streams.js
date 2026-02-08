// Cleanup script to remove duplicate active streams
// This will keep only the most recent stream for each user

import { supabase } from './lib/supabase.js';

async function cleanupDuplicateStreams() {
    console.log('🧹 CLEANING UP DUPLICATE ACTIVE STREAMS\n');
    console.log('='.repeat(60));

    try {
        // Get all active streams
        console.log('\n1️⃣ Fetching all active streams...');
        const { data: allStreams, error: fetchError } = await supabase
            .from('active_streams')
            .select('*')
            .order('last_ping', { ascending: false });

        if (fetchError) {
            console.error('❌ Error fetching streams:', fetchError);
            return;
        }

        console.log(`✅ Found ${allStreams.length} total stream records`);

        // Group streams by username
        const streamsByUser = {};
        allStreams.forEach(stream => {
            if (!streamsByUser[stream.username]) {
                streamsByUser[stream.username] = [];
            }
            streamsByUser[stream.username].push(stream);
        });

        console.log(`\n2️⃣ Found ${Object.keys(streamsByUser).length} unique users`);

        // For each user, keep only the most recent stream
        let deletedCount = 0;
        for (const [username, streams] of Object.entries(streamsByUser)) {
            if (streams.length > 1) {
                console.log(`\n👤 User: ${username} has ${streams.length} streams`);

                // Keep the first one (most recent due to ordering)
                const keepStream = streams[0];
                console.log(`   ✅ Keeping: ${keepStream.stream_name} (last ping: ${keepStream.last_ping})`);

                // Delete the rest
                const streamsToDelete = streams.slice(1);
                for (const stream of streamsToDelete) {
                    console.log(`   🗑️  Deleting: ${stream.stream_name} (last ping: ${stream.last_ping})`);

                    const { error: deleteError } = await supabase
                        .from('active_streams')
                        .delete()
                        .eq('id', stream.id);

                    if (deleteError) {
                        console.error(`   ❌ Failed to delete stream ${stream.id}:`, deleteError);
                    } else {
                        deletedCount++;
                    }
                }
            } else {
                console.log(`\n👤 User: ${username} - OK (only 1 stream)`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ CLEANUP COMPLETED`);
        console.log(`   - Total streams before: ${allStreams.length}`);
        console.log(`   - Streams deleted: ${deletedCount}`);
        console.log(`   - Streams remaining: ${allStreams.length - deletedCount}`);
        console.log('\nNow each user should have only their current channel!');

    } catch (error) {
        console.error('\n❌ CLEANUP FAILED:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

cleanupDuplicateStreams();
