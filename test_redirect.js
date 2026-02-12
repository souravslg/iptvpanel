
const fetch = globalThis.fetch;

async function testRedirect() {
    const url = 'http://localhost:3000/live/tivimate_test/password/1002.ts';
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, { redirect: 'manual' });
        console.log('Status:', res.status);
        console.log('Location:', res.headers.get('location'));
    } catch (e) {
        console.error('Error:', e);
    }
}

testRedirect();
