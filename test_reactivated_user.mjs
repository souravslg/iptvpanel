// Test reactivated user playback
const baseUrl = 'http://localhost:3000';

async function testReactivatedUser() {
    console.log('=== Testing Reactivated User Playback ===\n');

    // Step 1: Check user status in database
    console.log('Step 1: Checking user 22 status in database...');
    const { createClient } = await import('@supabase/supabase-js');
    const fs = await import('fs');
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
    const supabase = createClient(url, key);

    const { data: user } = await supabase
        .from('users')
        .select('username, status, expire_date')
        .eq('username', '22')
        .single();

    if (user) {
        console.log('User found:');
        console.log(`  Username: ${user.username}`);
        console.log(`  Status: ${user.status}`);
        console.log(`  Expire Date: ${user.expire_date}`);

        const expireDate = new Date(user.expire_date);
        const now = new Date();
        const isExpired = expireDate < now;

        console.log(`  Is Expired: ${isExpired}`);
        console.log(`  Is Active: ${user.status === 'Active' && !isExpired}\n`);
    } else {
        console.log('❌ User not found!\n');
        return;
    }

    // Step 2: Test playlist generation
    console.log('Step 2: Testing playlist generation...');
    const playlistRes = await fetch(`${baseUrl}/api/get?username=22&password=22`);
    const playlistText = await playlistRes.text();

    console.log(`Playlist Status: ${playlistRes.status}`);
    console.log(`Playlist Size: ${playlistText.length} bytes`);

    if (playlistText.includes('Account Expired')) {
        console.log('❌ Playlist returns "Account Expired" - user still considered expired!\n');
    } else {
        console.log('✅ Playlist generated successfully\n');
    }

    // Step 3: Test proxy access
    console.log('Step 3: Testing proxy stream access...');
    const proxyUrl = `${baseUrl}/live/22/22/1002.ts`;

    try {
        const proxyRes = await fetch(proxyUrl, { redirect: 'manual' });
        console.log(`Proxy Status: ${proxyRes.status}`);

        if (proxyRes.status === 302 || proxyRes.status === 307) {
            const location = proxyRes.headers.get('location');
            if (location.includes('invalid_subscription') || location.includes('BigBuckBunny')) {
                console.log('❌ Proxy redirects to expired video - user still blocked!');
                console.log(`Location: ${location.substring(0, 100)}...\n`);
            } else {
                console.log('✅ Proxy redirects to actual stream');
                console.log(`Location: ${location.substring(0, 100)}...\n`);
            }
        } else if (proxyRes.status === 404) {
            const text = await proxyRes.text();
            console.log('❌ Proxy returns 404:', text.substring(0, 150));
        } else {
            const text = await proxyRes.text();
            console.log(`Response: ${text.substring(0, 150)}\n`);
        }
    } catch (err) {
        console.log('❌ Error:', err.message, '\n');
    }

    // Step 4: Diagnostic summary
    console.log('=== DIAGNOSTIC SUMMARY ===');
    console.log('If user is Active and not expired but still cannot play:');
    console.log('1. Check if playlist contains proxy URLs (should be /live/...)');
    console.log('2. Check if proxy is returning 307 redirect (not 302 to expired video)');
    console.log('3. Check browser console for any CORS or network errors');
}

testReactivatedUser().catch(console.error);
