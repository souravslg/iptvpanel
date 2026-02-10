const { createClient } = require('@supabase/supabase-js');

// Hardcoded creds
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // efficient distinct query if possible, or just fetch some
    const { data, error } = await supabase.from('streams').select('type').limit(100);
    if (error) console.log(error);
    else {
        const types = new Set(data.map(d => d.type));
        console.log('Stream Types found:', Array.from(types));
    }
}

run();
