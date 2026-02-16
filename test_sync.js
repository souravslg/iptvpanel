// Test sync endpoint manually

async function testSync() {
    console.log('=== Testing Sync Endpoint ===\n');

    const url = 'http://localhost:3000/api/sync-playlist';

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer dev-secret-key'
            }
        });

        const result = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ Sync successful!');
            console.log(`   Source streams: ${result.sourceStreams}`);
            console.log(`   Updated: ${result.updated}`);
            console.log(`   Not found: ${result.notFound}`);
            console.log(`   Errors: ${result.errors}`);
        } else {
            console.log('\n❌ Sync failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSync();
