const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrls() {
    const { data, error } = await supabase
        .from('streams')
        .select('name, url')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Stream URLs from DB:');
    data.forEach(s => {
        console.log(`Name: ${s.name}`);
        console.log(`URL: ${s.url ? s.url.substring(0, 100) : 'null'}...`);
        console.log('---');
    });
}

checkUrls();
