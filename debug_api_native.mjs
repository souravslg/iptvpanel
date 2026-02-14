import http from 'http';

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        json: () => JSON.parse(data),
                        text: () => data
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        json: () => null,
                        text: () => data
                    });
                }
            });
        }).on('error', reject);
    });
}

async function checkApiResponse() {
    const username = 'home2';
    const password = 'home2';
    const host = 'http://localhost:3000';

    console.log(`Fetching from ${host}...`);

    // 2. Get Live Streams
    const streamsUrl = `${host}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    try {
        const res = await fetch(streamsUrl);
        if (res.status !== 200) {
            console.log('Failed to fetch streams. Status:', res.status);
            console.log('Response:', res.text());
            return;
        }

        const streams = res.json();
        console.log(`Fetched ${streams.length} streams.`);

        // Find JTV stream
        const jtvStream = streams.find(s => s.name && s.name.includes('Vande'));
        if (jtvStream) {
            console.log('\n--- SAMPLE JTV STREAM ---');
            console.log('Name:', jtvStream.name);
            console.log('Stream ID:', jtvStream.stream_id);
            console.log('Direct Source:', jtvStream.direct_source);
            console.log('Container Ext:', jtvStream.container_extension);
            console.log('Original URL:', jtvStream.url ? 'Present' : 'Missing');
        } else {
            console.log('No JTV stream found.');
        }

        // Find non-JTV stream (Star Plus/Hotstar) if any
        const otherStream = streams.find(s => s.name && !s.name.includes('Vande') && s.direct_source && s.direct_source.includes('|'));
        if (otherStream) {
            console.log('\n--- SAMPLE OTHER STREAM ---');
            console.log('Name:', otherStream.name);
            console.log('Direct Source:', otherStream.direct_source);
        }

    } catch (e) {
        console.error('Streams Fetch Failed:', e.message);
    }
}

checkApiResponse();
