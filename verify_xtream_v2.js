
// Native fetch is available in Node 18+

// Configuration
const BASE_URL = 'http://localhost:3000';
const USERNAME = 'tivimate_test'; // Ensure this user exists or use another valid one
const PASSWORD = 'password';     // and valid password (or user from check_current_config)

async function verifyXtream() {
    console.log(`--- Verifying Xtream API V2 at ${BASE_URL} ---`);

    // 1. Authenticate (get_live_categories not strictly auth, but good to check)
    // Xtream API is usually accessed via player_api.php?username=...&password=...&action=...
    const authUrl = `${BASE_URL}/api/player_api?username=${USERNAME}&password=${PASSWORD}`;

    // We need a valid user. Let's assume 'test_xtream_verify' exists or create one.
    // For now, let's try with a likely user from previous logs if possible, or just fail and report.
    // I'll use the user '121' found in check_current_config.js with password... I don't know the password.
    // Better to create a test user first or use the 'authenticate-local.js' script if exists?
    // I'll create a user in this script? No, better separate.

    console.log('1. Testing Authentication & Info...');
    try {
        const res = await fetch(authUrl);
        const data = await res.json();

        if (data.user_info && data.user_info.auth === 1) {
            console.log('   Auth Success!');
            console.log('   Server Info:', JSON.stringify(data.server_info, null, 2));
        } else {
            console.error('   Auth Failed:', data);
            return; // Cannot proceed without auth
        }

        // 2. Get Live Categories
        console.log('\n2. Testing get_live_categories...');
        const catsUrl = `${BASE_URL}/api/player_api?username=${USERNAME}&password=${PASSWORD}&action=get_live_categories`;
        const catsRes = await fetch(catsUrl);
        const cats = await catsRes.json();
        console.log(`   Fetched ${cats.length} categories.`);
        if (cats.length > 0) console.log('   Sample Category:', JSON.stringify(cats[0]));

        // 3. Get Live Streams
        console.log('\n3. Testing get_live_streams...');
        const streamsUrl = `${BASE_URL}/api/player_api?username=${USERNAME}&password=${PASSWORD}&action=get_live_streams`;
        const streamsRes = await fetch(streamsUrl);
        const streams = await streamsRes.json();
        console.log(`   Fetched ${streams.length} streams.`);

        if (streams.length > 0) {
            const s = streams[0];
            console.log('   Sample Stream:', JSON.stringify(s, null, 2));

            // Validation
            const errors = [];
            if (!s.stream_id) errors.push('Missing stream_id');
            if (!s.container_extension) errors.push('Missing container_extension');
            // TiviMate often expects stream_id to be int, but string usually works.

            if (errors.length > 0) console.error('   Validation Errors:', errors);
            else console.log('   Structure looks compliant.');
        }

    } catch (e) {
        console.error('Verification failed:', e);
    }
}

// Ensure fetch is available
if (!globalThis.fetch) {
    console.error('This script requires Node 18+ or node-fetch');
} else {
    verifyXtream();
}
