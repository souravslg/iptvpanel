// Quick test to get a test user and check the actual API response

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTestUser() {
    const { data: users } = await supabase
        .from('users')
        .select('username, password, status')
        .eq('status', 'Active')
        .limit(1);

    if (users && users.length > 0) {
        console.log('Test User Credentials:');
        console.log(`Username: ${users[0].username}`);
        console.log(`Password: ${users[0].password}`);
        console.log('\nUse these credentials to test the player_api:');
        console.log(`\nTest URL: http://localhost:3000/api/player_api?username=${users[0].username}&password=${users[0].password}&action=get_live_streams\n`);
    } else {
        console.log('No active users found. Please create a test user first.');
    }
}

getTestUser().catch(console.error);
