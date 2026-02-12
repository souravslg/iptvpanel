// Quick test to see what happens with an expired user
async function testExpiredUser() {
    const baseUrl = 'http://localhost:3000';

    console.log('=== Testing Expired User Access ===\n');

    // Test with user 22 (check if suspended)
    const response = await fetch(`${baseUrl}/api/get?username=22&password=22`);
    const text = await response.text();

    console.log('Status:', response.status);
    console.log('Content length:', text.length);

    // Check if it returns the expired video
    if (text.includes('Account Expired') || text.includes('invalid_subscription_video')) {
        console.log('✅ Properly returns expired/invalid playlist');
    } else {
        console.log('❌ Returns full playlist even though user is expired!');

        // Show first few entries
        const lines = text.split('\n').slice(0, 20);
        console.log('\nFirst 20 lines:');
        lines.forEach(line => console.log(line));
    }
}

testExpiredUser().catch(console.error);
