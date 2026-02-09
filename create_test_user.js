const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createInactiveUser() {
    // Check if user exists
    let { data: user } = await supabase.from('users').select('*').eq('username', 'test_inactive').single();

    if (!user) {
        const { data, error } = await supabase.from('users').insert({
            username: 'test_inactive',
            password: 'password123',
            status: 'Inactive',
            expire_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            max_connections: 1
        }).select().single();

        if (error) console.error('Error creating user:', error);
        else console.log('Created user:', data);
    } else {
        // Update to be inactive
        const { data, error } = await supabase.from('users').update({
            status: 'Inactive',
            expire_date: new Date(Date.now() - 86400000).toISOString()
        }).eq('username', 'test_inactive').select().single();

        if (error) console.error('Error updating user:', error);
        else console.log('Updated user:', data);
    }
}

createInactiveUser();
