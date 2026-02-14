import fetch from 'node-fetch';

async function checkApiResponse() {
    const username = 'home2';
    const password = 'home2';
    const host = 'http://localhost:3000';

    console.log(`Fetching from ${host}...`);

    // 1. Login
    const loginUrl = `${host}/player_api.php?username=${username}&password=${password}`;
    try {
        const res = await fetch(loginUrl);
        const data = await res.json();
        console.log('Login Status:', res.status);
        console.log('User Info:', data.user_info);
        console.log('Server Info:', data.server_info);
    } catch (e) {
        console.error('Login Failed:', e.message);
    }

    // 2. Get Live Streams
    const streamsUrl = `${host}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    try {
        const res = await fetch(streamsUrl);
        const streams = await res.json();
        console.log(`Fetched ${streams.length} streams.`);

        // Check first JTV stream
        const jtvStream = streams.find(s => s.name && s.name.includes('Vande'));
        if (jtvStream) {
            console.log('\n--- SAMPLE STREAM ---');
            console.log('Name:', jtvStream.name);
            console.log('Stream ID:', jtvStream.stream_id);
            console.log('Direct Source:', jtvStream.direct_source);
            console.log('Container Ext:', jtvStream.container_extension);
        } else {
            console.log('No JTV stream found to check.');
        }
    } catch (e) {
        console.error('Streams Fetch Failed:', e.message);
    }
}

checkApiResponse();
