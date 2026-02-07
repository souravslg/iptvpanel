
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Config from lib/supabase.js
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetPassword() {
    console.log('--- Resetting Admin Password ---');

    const email = 'srviptvindia@gmail.com';
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { data, error } = await supabase
        .from('admin')
        .update({ password: hashedPassword })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Failed to update password:', error.message);
    } else {
        console.log('Password updated successfully for:', email);
        console.log('New Password:', newPassword);
    }
}

resetPassword();
