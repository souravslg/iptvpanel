
import { supabase } from '../lib/supabase.js';

async function resetUser() {
    const username = 'tivimate_test';
    const password = 'password';

    console.log(`Resetting user ${username}...`);

    // Check if user exists
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (user) {
        const { error } = await supabase
            .from('users')
            .update({
                password: password,
                status: 'Active',
                max_connections: 5,
                expire_date: '2027-01-01 00:00:00'
            })
            .eq('username', username);

        if (error) console.error('Error updating user:', error);
        else console.log('User updated successfully.');
    } else {
        const { error } = await supabase
            .from('users')
            .insert({
                username: username,
                password: password,
                status: 'Active',
                max_connections: 5,
                expire_date: '2027-01-01 00:00:00',
                created_at: new Date().toISOString()
            });

        if (error) console.error('Error creating user:', error);
        else console.log('User created successfully.');
    }
}

resetUser();
