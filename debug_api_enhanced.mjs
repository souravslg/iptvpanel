import http from 'http';

function fetch(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
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
        });

        req.on('error', (e) => {
            console.error('Request Error:', e);
            reject(e);
        });
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
        console.log(`Fetched ${streams ? streams.length : 0} streams.`);
    } catch (e) {
        console.error('Streams Fetch Failed (Catch Block):', e);
    }
}

checkApiResponse();
