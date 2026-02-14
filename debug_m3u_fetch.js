const NEW_SOURCE_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u';

async function testFetch() {
    console.log(`Fetching ${NEW_SOURCE_URL}...`);
    try {
        const response = await fetch(NEW_SOURCE_URL);
        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Content Length: ${text.length}`);
        console.log(`First 100 chars: ${text.substring(0, 100)}`);
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testFetch();
