// Test Xtream API authentication
import { supabase } from './lib/supabase.js';

async function testXtreamAuth() {
    console.log('=== TESTING XTREAM API AUTHENTICATION ===\n');

    // Get a test user
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .limit(3);

    console.log('Available test users:');
    users?.forEach(user => {
        console.log(`  ${user.username} / ${user.password}`);
        console.log(`    Status: ${user.status}`);
        console.log(`    Expires: ${user.expire_date}`);
        console.log(`    Max Connections: ${user.max_connections}`);
        console.log('');
    });

    // Test authentication logic
    if (users && users.length > 0) {
        const testUser = users[0];
        console.log('Testing user:', testUser.username);

        // Check status
        if (testUser.status !== 'Active') {
            console.log('❌ USER STATUS NOT ACTIVE:', testUser.status);
        } else {
            console.log('✅ Status: Active');
        }

        // Check expiry
        const now = new Date();
        const expireDate = testUser.expire_date ? new Date(testUser.expire_date) : null;

        if (expireDate && expireDate < now) {
            console.log('❌ USER EXPIRED');
            console.log('   Expire Date:', expireDate);
            console.log('   Current Date:', now);
        } else {
            console.log('✅ Not expired');
            if (expireDate) {
                console.log('   Expires:', expireDate);
            }
        }
    }

    // Check active playlists
    const { data: playlists } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_active', true);

    console.log('\nActive Playlists:', playlists?.length || 0);
    playlists?.forEach(p => {
        console.log(`  - ${p.name} (${p.total_channels} channels)`);
    });

    process.exit(0);
}

testXtreamAuth().catch(console.error);
