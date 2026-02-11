
async function checkUrl() {
    const url = 'https://j-plus.free.nf/jtv/jtv.m3u.php?i=1';
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'GET', // Change to GET to see body if needed
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        console.log('Status:', response.status);
        console.log('Headers:');
        response.headers.forEach((val, key) => console.log(`${key}: ${val}`));

        const text = await response.text();
        console.log('\nBody Preview (first 500 chars):');
        console.log(text.substring(0, 500));

    } catch (error) {
        console.error('Error:', error);
    }
}

checkUrl();
