async function testInactiveLogin() {
    const baseUrl = 'http://127.0.0.1:3000/api/player_api';
    const params = new URLSearchParams({
        username: 'test_inactive',
        password: 'password123'
    });

    console.log('Testing Authentication...');
    try {
        const authRes = await fetch(`${baseUrl}?${params.toString()}`);
        console.log('Status:', authRes.status);
        const authData = await authRes.json();
        console.log('Auth Response:', JSON.stringify(authData, null, 2));

        if (authData.user_info && authData.user_info.auth === 1) {
            console.log('\nTesting get_live_streams...');
            params.append('action', 'get_live_streams');
            const streamsRes = await fetch(`${baseUrl}?${params.toString()}`);
            const streamsData = await streamsRes.json();
            console.log('Streams Response:', JSON.stringify(streamsData, null, 2));
        } else {
            console.log('Auth failed or blocked.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testInactiveLogin();
