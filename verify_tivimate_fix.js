const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('1. Setting up test user...');
    // Create or update user
    let { data: user } = await supabase.from('users').select('*').eq('username', 'tivimate_test').single();

    if (!user) {
        const { data, error } = await supabase.from('users').insert({
            username: 'tivimate_test',
            password: 'password123',
            status: 'Active',
            expire_date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days active
            max_connections: 1
        }).select().single();
        if (error) {
            console.error('Create error:', error);
            return;
        }
    } else {
        await supabase.from('users').update({
            status: 'Active',
            expire_date: new Date(Date.now() + 86400000 * 30).toISOString()
        }).eq('username', 'tivimate_test');
    }

    console.log('2. Testing API...');
    const baseUrl = 'http://127.0.0.1:3000/api/player_api';
    const params = new URLSearchParams({
        username: 'tivimate_test',
        password: 'password123'
    });

    // 1. Check Server Info & Time Format
    console.log('   Testing Auth & Server Info...');
    const authRes = await fetch(`${baseUrl}?${params.toString()}`);
    const authData = await authRes.json();

    // Check time_now format: YYYY-MM-DD HH:mm:ss
    const timeNow = authData.server_info?.time_now;
    const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    const timePass = timeRegex.test(timeNow);
    console.log('   Time Format (YYYY-MM-DD HH:mm:ss):', timePass ? 'PASS' : `FAIL (${timeNow})`);

    // Check Version
    const version = authData.server_info?.version;
    const xui = authData.server_info?.xui;
    console.log('   Version 2.9.0:', version === '2.9.0' ? 'PASS' : `FAIL (${version})`);
    console.log('   XUI Flag:', xui === true ? 'PASS' : `FAIL (${xui})`);

    // 2. Check Categories
    console.log('   Testing Live Categories...');
    params.set('action', 'get_live_categories');
    const catRes = await fetch(`${baseUrl}?${params.toString()}`);
    const catData = await catRes.json();

    let catIdPass = true;
    if (Array.isArray(catData) && catData.length > 0) {
        catIdPass = catData.every(c => typeof c.category_id === 'string' && /^\d+$/.test(c.category_id));
        console.log('   Category IDs are numeric strings:', catIdPass ? 'PASS' : 'FAIL');
        if (!catIdPass) console.log('   Sample Category:', catData[0]);
    } else {
        console.log('   No categories found (might need active playlists/streams)');
    }

    // 3. Check Streams
    console.log('   Testing Live Streams...');
    params.set('action', 'get_live_streams');
    const liveRes = await fetch(`${baseUrl}?${params.toString()}`);
    const liveData = await liveRes.json();

    let streamPass = true;
    let addedPass = true;
    let epgPass = true;

    if (Array.isArray(liveData) && liveData.length > 0) {
        // Check Category ID matches numeric string format
        const badStream = liveData.find(s => typeof s.category_id !== 'string' || !/^\d+$/.test(s.category_id));
        if (badStream) {
            streamPass = false;
            console.log('   Stream Category ID Fail:', badStream);
        }

        // Check Stream ID is Number
        const badId = liveData.find(s => typeof s.stream_id !== 'number');
        if (badId) {
            console.log('   Stream ID Type Fail (Expected Number):', typeof badId.stream_id);
        } else {
            console.log('   Stream ID Type (Number): PASS');
        }

        // Check 'added' is unix timestamp
        const badAdded = liveData.find(s => !/^\d+$/.test(s.added));
        if (badAdded) {
            addedPass = false;
            console.log('   Stream Added Timestamp Fail:', badAdded.added);
        }

        // Check EPG Channel ID presence
        const badEpg = liveData.find(s => !s.hasOwnProperty('epg_channel_id'));
        if (badEpg) {
            epgPass = false;
            console.log('   Stream EPG Channel ID Missing:', badEpg);
        }

        console.log('   Stream Category IDs:', streamPass ? 'PASS' : 'FAIL');
        console.log('   Stream Added Timestamps:', addedPass ? 'PASS' : 'FAIL');
        console.log('   Stream EPG Channel ID Present:', epgPass ? 'PASS' : 'FAIL');
    } else {
        console.log('   No streams found');
    }
}

runTest();
