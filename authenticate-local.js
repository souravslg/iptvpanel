/**
 * Local Authentication Script for SonyLiv & TataPlay (No Dependencies)
 * 
 * Run this to authenticate and save sessions to Supabase.
 * This version uses native Node.js 'https' module - no 'npm install' needed.
 */

const https = require('https');
const readline = require('readline');

// ========================================
// CONFIGURATION
// ========================================
const SUPABASE_URL = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

// ========================================
// HELPERS
// ========================================

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function getRandomIndianIP() {
    const ranges = ['49.32.', '103.21.', '106.210.', '117.211.', '157.34.', '1.38.', '27.56.'];
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    return range + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
}

function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;
        const urlObj = new URL(url);

        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                ...options.headers,
                'Content-Length': body ? Buffer.byteLength(body) : 0
            }
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(parsed), text: () => Promise.resolve(data) });
                } catch (e) {
                    resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.reject(e), text: () => Promise.resolve(data) });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(body);
        req.end();
    });
}

async function saveToSupabase(key, value) {
    const res = await request(`${SUPABASE_URL}/rest/v1/settings`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: { key: key, value: JSON.stringify(value) }
    });

    if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`);
    return true;
}

async function authenticateSonyLiv() {
    console.log('\n=== SonyLiv Authentication ===\n');
    const mobileNumber = await question('Enter mobile number (91XXXXXXXXXX): ');
    const cleanNumber = mobileNumber.replace(/\+/g, '').replace(/^91/, '');
    const ip = getRandomIndianIP();

    console.log(`\nRequesting OTP for ${cleanNumber} (IP: ${ip})...`);

    const otpRes = await request('https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/CREATEOTP-V2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.sonyliv.com',
            'Referer': 'https://www.sonyliv.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'X-Forwarded-For': ip,
            'Client-IP': ip
        },
        body: { mobileNumber: cleanNumber, countryCode: '91' }
    });

    const otpData = await otpRes.json();
    if (!otpRes.ok || otpData.resultCode !== 'OK') {
        console.error('❌ Failed:', otpData.message || 'Unknown');
        return;
    }

    console.log('✅ OTP sent!');
    const otp = await question('Enter OTP: ');

    console.log('Verifying...');
    const vRes = await request('https://apiv2.sonyliv.com/AGL/1.6/A/ENG/WEB/IN/HR/VERIFYOTP-V2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.sonyliv.com',
            'X-Forwarded-For': ip
        },
        body: { mobileNumber: cleanNumber, otp: otp, countryCode: '91' }
    });

    const vData = await vRes.json();
    if (!vRes.ok || vData.resultCode !== 'OK') {
        console.error('❌ Failed:', vData.message || 'Unknown');
        return;
    }

    const session = { number: cleanNumber, token: vData.resultObj.jwt, userId: vData.resultObj.userId, lastUpdated: new Date().toISOString() };
    await saveToSupabase('sonyliv_session', session);
    console.log('✅ SonyLiv authenticated and saved!\n');
}

async function authenticateTataPlay() {
    console.log('\n=== Tata Play Authentication ===\n');
    const sid = await question('Enter Subscriber ID: ');
    const ip = getRandomIndianIP();

    console.log(`\nRequesting OTP for ${sid} (IP: ${ip})...`);

    const otpRes = await request('https://tm.tataplay.com/tap-api/v1/user/login/otp/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-device-id': 'web-v1',
            'Origin': 'https://watch.tataplay.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'X-Forwarded-For': ip
        },
        body: { subscriberId: sid }
    });

    const otpData = await otpRes.json();
    if (!otpRes.ok || otpData.status !== 'SUCCESS') {
        console.error('❌ Failed:', otpData.message || 'Unknown');
        return;
    }

    console.log('✅ OTP sent!');
    const otp = await question('Enter OTP: ');

    console.log('Verifying...');
    const vRes = await request('https://tm.tataplay.com/tap-api/v1/user/login/otp/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-device-id': 'web-v1',
            'Origin': 'https://watch.tataplay.com',
            'X-Forwarded-For': ip
        },
        body: { subscriberId: sid, otp: otp }
    });

    const vData = await vRes.json();
    if (!vRes.ok || vData.status !== 'SUCCESS') {
        console.error('❌ Failed:', vData.message || 'Unknown');
        return;
    }

    const session = { sid: sid, accessToken: vData.data.accessToken, refreshToken: vData.data.refreshToken, userToken: vData.data.userToken, lastUpdated: new Date().toISOString() };
    await saveToSupabase('tataplay_session', session);
    console.log('✅ Tata Play authenticated and saved!\n');
}

async function main() {
    console.log('Select service:\n1. SonyLiv\n2. Tata Play\n3. Both');
    const choice = await question('Choice: ');
    try {
        if (choice === '1' || choice === '3') await authenticateSonyLiv();
        if (choice === '2' || choice === '3') await authenticateTataPlay();
    } catch (e) {
        console.error('\n❌ Error:', e.message);
    }
    rl.close();
}

main();
