
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Config from lib/supabase.js (hardcoded safely here for script use)
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdmin() {
    console.log('--- Checking Admin Users ---');

    // Check existing admins
    const { data: admins, error } = await supabase
        .from('admin')
        .select('*');

    if (error) {
        console.error('Error fetching admins:', error.message);
        return;
    }

    if (admins && admins.length > 0) {
        console.log('Existing Admin Users:');
        admins.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}`));
    } else {
        console.log('No admin users found. Creating default admin...');

        const email = 'admin@example.com';
        const password = 'admin'; // Default password
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newAdmin, error: createError } = await supabase
            .from('admin')
            .insert([{ email, password: hashedPassword }])
            .select();

        if (createError) {
            console.error('Failed to create default admin:', createError.message);
        } else {
            console.log('Default Admin Created:');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        }
    }
}

checkAdmin();
