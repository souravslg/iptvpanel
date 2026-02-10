const { createClient } = require('@supabase/supabase-js');

// Hardcoded creds
const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = 'http://localhost:3000/api/player_api';
const username = 'tivimate_test';
const password = 'password123';

async function setupUser() {
    console.log('0. Setting up test user...');
    let { data: user } = await supabase.from('users').select('*').eq('username', username).single();
    if (!user) {
        await supabase.from('users').insert({
            username, password, status: 'Active',
            expire_date: new Date(Date.now() + 86400000 * 30).toISOString(), max_connections: 1
        });
    } else {
        await supabase.from('users').update({ status: 'Active' }).eq('username', username);
    }
}

async function runTest() {
    await setupUser();
    console.log('1. Testing Actions Compliance...');

    // Test get_vod_categories
    try {
        const url = `${baseUrl}?username=${username}&password=${password}&action=get_vod_categories`;
        console.log(`   Fetching ${url}...`);
        const res = await fetch(url);
        console.log(`   Status: ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
            console.log('   get_vod_categories: PASS (Returned Array)');
        } else {
            console.log('   get_vod_categories: FAIL (Returned Object/Other)');
            console.log('   Response:', JSON.stringify(data));
        }
    } catch (e) {
        console.log('   get_vod_categories: CRITICAL FAIL', e.message);
    }

    // Test get_live_streams
    try {
        const url = `${baseUrl}?username=${username}&password=${password}&action=get_live_streams`;
        console.log(`   Fetching ${url}...`);
        const res = await fetch(url);
        console.log(`   Status: ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
            const nonLive = data.find(s => s.stream_type !== 'live');
            if (nonLive) {
                console.log('   get_live_streams Filter: FAIL (Found non-live stream)');
                console.log('   Sample:', nonLive.name, nonLive.stream_type);
            } else {
                console.log('   get_live_streams Filter: PASS (All live)');
            }
        } else {
            console.log('   get_live_streams: FAIL (Not an array)');
        }
    } catch (e) {
        console.log('   get_live_streams: FAIL', e.message);
    }
}

runTest();
