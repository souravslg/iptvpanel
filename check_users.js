const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://qbnmmvvxwgamoqitazjl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibm1tdnZ4d2dhbW9xaXRhempsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5Nzc0NzcsImV4cCI6MjA1MzU1MzQ3N30.RsHnkh0L9g3EfxhQ-uBDWWIqv5tM9lCv0ZbSokMvZ0Y'
);

async function checkUsers() {
    console.log('\n=== Database Diagnostic ===\n');

    // Check all users (RLS might be blocking)
    const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('*');

    console.log('All users query:');
    console.log('Error:', allError);
    console.log('Data:', allUsers);
    console.log('Count:', allUsers ? allUsers.length : 0);

    if (allUsers && allUsers.length > 0) {
        console.log('\n=== First User ===');
        console.log(JSON.stringify(allUsers[0], null, 2));

        // Try specific user query
        const { data: specificUser, error: specificError } = await supabase
            .from('users')
            .select('*')
            .eq('username', allUsers[0].username)
            .eq('password', allUsers[0].password)
            .single();

        console.log('\n=== Specific User Query ===');
        console.log('Error:', specificError);
        console.log('Data:', specificUser);
    }

    // Check user with username='22'
    console.log('\n=== Checking user 22 ===');
    const { data: user22, error: error22 } = await supabase
        .from('users')
        .select('*')
        .eq('username', '22');

    console.log('User 22 query:');
    console.log('Error:', error22);
    console.log('Data:', user22);
}

checkUsers().catch(console.error);
