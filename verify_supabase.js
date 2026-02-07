
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('--- Verifying Supabase Connection ---');

    try {
        const { data, error } = await supabase.from('admin').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection Failed or Table Missing:', error.message);
            if (error.code === '42P01') {
                console.error('HINT: Did you run schema.sql? Table "admin" does not exist.');
            }
        } else {
            console.log('Connection Successful!');
            console.log('Admin Table Access: OK');
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

verify();
