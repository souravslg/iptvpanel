const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let env = {};
try {
    let envContent = '';
    if (fs.existsSync('.env.local')) envContent += fs.readFileSync('.env.local', 'utf8') + '\n';
    if (fs.existsSync('.env')) envContent += fs.readFileSync('.env', 'utf8') + '\n';
    envContent.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) { }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
    // 1. Create Active User
    let { data: user } = await supabase.from('users').select('*').eq('username', 'test_active').single();
    if (!user) {
        await supabase.from('users').insert({
            username: 'test_active',
            password: 'password123',
            status: 'Active',
            expire_date: new Date(Date.now() + 86400000).toISOString(),
            max_connections: 5
        });
        console.log('Created test_active');
    } else {
        await supabase.from('users').update({ status: 'Active', expire_date: new Date(Date.now() + 86400000).toISOString() }).eq('username', 'test_active');
        console.log('Updated test_active');
    }

    // 2. Get a Stream ID
    const { data: streams } = await supabase.from('streams').select('id, stream_id').limit(1);
    if (!streams || streams.length === 0) {
        console.log('No streams found');
        return;
    }
    console.log('Stream ID:', streams[0].stream_id || streams[0].id);
}

setup();
