// Native fetch is available in Node 18+

const TEST_URL = 'http://localhost:3000/live/121/121/1922.ts';
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function debugStream() {
    console.log(`Fetching ${TEST_URL}...`);
    try {
        // 1. Try HEAD first
        const headRes = await fetch(TEST_URL, {
            method: 'HEAD',
            headers: { 'User-Agent': CHROME_UA, 'Accept': '*/*' },
            redirect: 'manual'
        });
        console.log(`\nHEAD Proxy Status: ${headRes.status}`);
        const loc = headRes.headers.get('location');
        if (loc) {
            console.log(`Redirect Location: ${loc}`);
            const headTarget = await fetch(loc, { method: 'HEAD', headers: { 'User-Agent': CHROME_UA } });
            console.log(`HEAD Target Status: ${headTarget.status}`);

            // Log cookies if any
            const cookies = headTarget.headers.get('set-cookie');
            if (cookies) console.log('HEAD Target Cookies:', cookies);
        }

        // 2. Try GET with Chrome UA & Referer
        console.log(`\nSwitched to GET request (Chrome UA)...`);
        const res = await fetch(TEST_URL, {
            method: 'GET',
            headers: {
                'User-Agent': CHROME_UA,
                'Accept': '*/*'
            },
            redirect: 'manual'
        });

        console.log(`GET Proxy Status: ${res.status}`);

        if (res.status >= 300 && res.status < 400) {
            const outputLocation = res.headers.get('location');
            if (outputLocation) {
                console.log(`Following redirect to ${outputLocation}...`);

                // Parse pipe headers if present
                let targetUrl = outputLocation;
                const headers = { 'User-Agent': CHROME_UA, 'Accept': '*/*' };

                if (outputLocation.includes('|')) {
                    const parts = outputLocation.split('|');
                    targetUrl = parts[0];
                    const headerPart = parts[1];
                    const pairs = headerPart.split('&');
                    for (const pair of pairs) {
                        const [key, val] = pair.split('=');
                        if (key && val) headers[key] = val;
                    }
                    console.log('Parsed Pipe Headers:', headers);
                }

                const res2 = await fetch(targetUrl, {
                    method: 'GET',
                    headers: headers
                });

                console.log(`GET Target Status: ${res2.status}`);
                const headers2 = {};
                res2.headers.forEach((v, k) => headers2[k] = v);
                console.log('Target Headers:', headers2);

                if (res2.ok) {
                    const arrayBuffer = await res2.arrayBuffer();
                    const buf = Buffer.from(arrayBuffer);
                    console.log('Body Size:', buf.length);
                    console.log('First 100 bytes (str):', buf.slice(0, 100).toString('utf8').replace(/[^\x20-\x7E]/g, '.'));
                } else {
                    console.log('Target Error Text:', await res2.text());
                }
            }
        } else if (res.status === 200) {
            console.log('Proxied Content-Type:', res.headers.get('content-type'));
            const arrayBuffer = await res.arrayBuffer();
            const buf = Buffer.from(arrayBuffer);
            console.log('Body Size:', buf.length);
            console.log('First 100 bytes (str):', buf.slice(0, 100).toString('utf8').replace(/[^\x20-\x7E]/g, '.'));
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

debugStream();
