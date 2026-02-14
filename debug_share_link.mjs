import fetch from 'node-fetch';

const linkId = '7e442b1782cfab77468ca2444ff9ce02';
const shareUrl = `http://localhost:3000/share/${linkId}`;

console.log('\n🔍 Testing Share Link:', shareUrl, '\n');

async function testShareLink() {
    try {
        console.log('Fetching share URL...');
        const response = await fetch(shareUrl);

        console.log('Status Code:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const contentType = response.headers.get('content-type');
        const text = await response.text();

        console.log('\nContent Type:', contentType);
        console.log('Response Length:', text.length, 'bytes');

        if (response.status === 200) {
            console.log('\n✅ SUCCESS! M3U content retrieved');
            console.log('First 200 chars:', text.substring(0, 200));
        } else {
            console.log('\n❌ ERROR Response:');
            console.log(text);
        }

    } catch (error) {
        console.error('\n❌ Request failed:', error.message);
    }
}

testShareLink();
