const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
// const fetch = require('node-fetch'); // Use global fetch

// Manual env parsing
let env = {};
try {
    let envContent = '';
    if (fs.existsSync('.env.local')) envContent += fs.readFileSync('.env.local', 'utf8') + '\n';
    if (fs.existsSync('.env')) envContent += fs.readFileSync('.env', 'utf8') + '\n';

    envContent.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) {
    console.log('Error reading env files:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('1. Setting up test user...');
    // Create or update user
    let { data: user } = await supabase.from('users').select('*').eq('username', 'test_inactive').single();

    if (!user) {
        const { data, error } = await supabase.from('users').insert({
            username: 'test_inactive',
            password: 'password123',
            status: 'Inactive',
            expire_date: new Date(Date.now() - 86400000).toISOString(),
            max_connections: 1
        }).select().single();
        if (error) console.error('Create error:', error);
    } else {
        await supabase.from('users').update({
            status: 'Inactive',
            expire_date: new Date(Date.now() - 86400000).toISOString()
        }).eq('username', 'test_inactive');
    }

    console.log('2. Testing API...');
    const baseUrl = 'http://127.0.0.1:3000/api/player_api';
    const params = new URLSearchParams({
        username: 'test_inactive',
        password: 'password123'
    });

    console.log('   Testing Auth...');
    const authRes = await fetch(`${baseUrl}?${params.toString()}`);
    const authData = await authRes.json();
    console.log('   Auth:', authData.user_info.auth === 1 ? 'PASS' : 'FAIL', `(${authData.user_info.message})`);

    console.log('   Testing Live Streams...');
    params.set('action', 'get_live_streams');
    const liveRes = await fetch(`${baseUrl}?${params.toString()}`);
    const liveData = await liveRes.json();
    const hasVideo = Array.isArray(liveData) && liveData.length === 1 && liveData[0].direct_source.includes('mp4');
    console.log('   Live:', hasVideo ? 'PASS' : 'FAIL', JSON.stringify(liveData).substring(0, 100));

    console.log('   Testing VOD Streams...');
    params.set('action', 'get_vod_streams');
    const vodRes = await fetch(`${baseUrl}?${params.toString()}`);
    const vodData = await vodRes.json();
    const emptyVod = Array.isArray(vodData) && vodData.length === 0;
    console.log('   VOD:', emptyVod ? 'PASS' : 'FAIL', JSON.stringify(vodData));
}

runTest();
