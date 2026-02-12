
// Native fetch is available in Node 18+

async function triggerSync() {
    console.log('Triggering JTV Sync via API on localhost:3001...');
    try {
        const response = await fetch('http://localhost:3001/api/jtv/refresh', {
            method: 'POST'
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

triggerSync();
