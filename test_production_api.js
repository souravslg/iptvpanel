const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductionAPI() {
    console.log('=== TESTING PRODUCTION API ===\n');

    // Get a valid user
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('username, password, status, expire_date')
        .eq('status', 'Active')
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('No active users found:', userError);
        return;
    }

    const user = users[0];
    console.log(`Testing with user: ${user.username}`);
    console.log(`Password: ${user.password}`);
    console.log(`Status: ${user.status}\n`);

    // Test the production API
    const url = `https://iptvpanel.vercel.app/api/player_api?username=${user.username}&password=${user.password}&action=get_live_streams`;
    console.log(`Testing URL: ${url}\n`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log(`✅ API Response: ${data.length} channels returned`);
            console.log('\nSample channels (first 5):');
            data.slice(0, 5).forEach((ch, i) => {
                console.log(`  ${i + 1}. ${ch.name}`);
            });

            console.log(`\n=== RESULT ===`);
            console.log(`Production API is returning: ${data.length} channels`);
            console.log(`Expected (active playlist): 978 channels`);

            if (data.length === 978) {
                console.log(`\n✅ SUCCESS! Production is serving the correct active playlist!`);
            } else if (data.length === 1125) {
                console.log(`\n❌ PROBLEM! Production is still serving the OLD playlist (homey)`);
                console.log(`This means the deployment hasn't completed or there's a caching issue.`);
            } else {
                console.log(`\n⚠️  UNEXPECTED! Got ${data.length} channels (expected 978 or 1125)`);
            }
        } else {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            console.error('Response:', data);
        }
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
    }
}

testProductionAPI().catch(console.error);
