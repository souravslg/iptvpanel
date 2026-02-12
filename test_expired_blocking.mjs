// Test that expired users are blocked from watching
const baseUrl = 'http://localhost:3000';

async function testExpiredUserBlocking() {
    console.log('=== Testing Expired User Access Control ===\n');

    // Step 1: Expire user 22
    console.log('Step 1: Expiring user 22...');
    const { createClient } = await import('@supabase/supabase-js');
    const fs = await import('fs');
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
    const supabase = createClient(url, key);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await supabase.from('users').update({
        status: 'Suspended',
        expire_date: pastDate.toISOString()
    }).eq('username', '22');

    console.log('✅ User 22 is now expired\n');

    // Step 2: Try to access a stream via proxy
    console.log('Step 2: Trying to access stream via proxy...');
    const proxyUrl = `${baseUrl}/live/22/22/1002.ts`;

    const res = await fetch(proxyUrl, { redirect: 'manual' });
    console.log(`Response status: ${res.status}`);

    if (res.status === 302 || res.status === 307) {
        const location = res.headers.get('location');
        if (location.includes('invalid_subscription') || location.includes('BigBuckBunny')) {
            console.log('✅ SUCCESS - Redirects to expired video');
            console.log(`Location: ${location}`);
        } else {
            console.log('❌ FAILED - Still redirects to actual stream!');
            console.log(`Location: ${location.substring(0, 100)}`);
        }
    } else if (res.status === 403 || res.status === 401) {
        console.log('✅ SUCCESS - Returns unauthorized');
    } else {
        const text = await res.text();
        console.log('Response:', text.substring(0, 200));
    }

    // Step 3: Check playlist endpoint
    console.log('\nStep 3: Checking playlist endpoint...');
    const playlistRes = await fetch(`${baseUrl}/api/get?username=22&password=22`);
    const playlistText = await playlistRes.text();

    if (playlistText.includes('Account Expired')) {
        console.log('✅ Playlist returns "Account Expired" message');
    } else {
        console.log('❌ Playlist still returns full content');
    }
}

testExpiredUserBlocking().catch(console.error);
