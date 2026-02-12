// Better test to see the actual playlist structure
const baseUrl = 'http://localhost:3000';

async function testPlaylist() {
    console.log('=== Testing Fixed Xtream Playlist ===\n');

    try {
        const response = await fetch(`${baseUrl}/api/get?username=22&password=22`);
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content length:', text.length, 'bytes\n');

        // Find the first complete entry (EXTINF + URL)
        const lines = text.split('\n');
        let foundFirst = false;
        let count = 0;

        console.log('=== FIRST 3 CHANNEL ENTRIES ===\n');

        for (let i = 0; i < lines.length && count < 3; i++) {
            const line = lines[i].trim();

            if (line.startsWith('#EXTINF')) {
                console.log(`\n--- Channel ${count + 1} ---`);
                console.log(line.substring(0, 120) + '...');

                // Look ahead for other metadata and URL
                for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine.startsWith('#')) {
                        console.log(nextLine.substring(0, 100));
                    } else if (nextLine && !nextLine.startsWith('#')) {
                        // This is the stream URL
                        console.log('URL:', nextLine.substring(0, 150));

                        // Check if it's direct or proxy URL
                        if (nextLine.includes('/live/')) {
                            console.log('❌ PROXY URL (should be direct!)');
                        } else if (nextLine.startsWith('http')) {
                            console.log('✅ DIRECT URL (correct!)');
                        }

                        count++;
                        i = j;
                        break;
                    }
                }
            }
        }

        // Count proxy vs direct URLs
        const proxyCount = (text.match(/\/live\/\d+\/\d+\//g) || []).length;
        const directCount = text.split('\n').filter(line =>
            !line.startsWith('#') &&
            line.trim() &&
            line.includes('http') &&
            !line.includes('/live/')
        ).length;

        console.log(`\n=== SUMMARY ===`);
        console.log(`Proxy URLs: ${proxyCount}`);
        console.log(`Direct URLs: ${directCount}`);
        console.log(`\nFix Status: ${proxyCount === 0 && directCount > 0 ? '✅ SUCCESS' : '❌ FAILED'}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPlaylist().catch(console.error);
