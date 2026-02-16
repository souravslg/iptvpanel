// Test if the issue is Vercel-specific or if cookies work at all

async function testDirectVsVercel() {
    console.log('=== Testing Direct Access vs Vercel Proxy ===\n');

    // Get a stream from database
    const { createClient } = await import('@supabase/supabase-js');
    const dotenv = await import('dotenv');

    dotenv.config({ path: '.env.local' });

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Colors HD%')
        .limit(1)
        .single();

    if (!stream) {
        console.log('Stream not found');
        return;
    }

    const headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
    const targetUrl = stream.url;

    console.log('Target URL:', targetUrl.substring(0, 70) + '...');
    console.log('');

    // Test 1: Direct access with cookies
    console.log('Test 1: Direct access to JioTV with cookies');
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Cookie': headers.Cookie,
                'User-Agent': headers['User-Agent']
            },
            redirect: 'manual'
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.status === 200) {
            console.log('✅ Direct access works!');
        } else if (response.status === 451) {
            console.log('❌ 451 Error - Cookies may be invalid or IP blocked');
        } else {
            console.log(`⚠️  Unexpected status: ${response.status}`);
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('');

    // Test 2: Localhost proxy
    console.log('Test 2: Localhost proxy');
    try {
        const response = await fetch(`http://localhost:3000/live/shiv/shiv1/${stream.stream_id}.mpd`, {
            redirect: 'manual'
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.status === 200) {
            const text = await response.text();
            if (text.includes('MPD')) {
                console.log('✅ Localhost proxy works!');
            }
        } else if (response.status === 302) {
            console.log('⚠️  Still redirecting (old code)');
        } else if (response.status === 451) {
            console.log('❌ 451 Error from localhost too!');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n=== DIAGNOSIS ===');
    console.log('If both fail with 451: Cookies have expired or IP is blocked');
    console.log('If direct works but proxy fails: Proxy issue');
    console.log('If localhost works but Vercel fails: Vercel IP might be blocked by JioTV');
}

testDirectVsVercel();
