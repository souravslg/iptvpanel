const fs = require('fs');

// Test if Xtream URLs are being constructed correctly
async function testXtreamURLs() {
    console.log('=== Testing Xtream URL Construction ===\n');

    // Simulate what player_api returns
    const protocol = 'https';
    const host = 'iptvpanel.vercel.app';
    const username = 'testuser';
    const password = 'testpass';
    const streamId = '1000009246';
    const extension = 'ts';

    // Standard Xtream URL format
    const live ProxyURL = `${protocol}://${host}/live/${username}/${password}/${streamId}.${extension}`;

    // What direct mode should return (clean URL)
    const cleanDirectURL = 'https://jiotvbpkmob.cdn.jio.com/bpk-tv/Vande_Gujarat_1_BTS/output/index.mpd';

    // What it was returning before (with pipe headers - WRONG)
    const wrongDirectURL = cleanDirectURL + '|User-Agent=Mozilla&Referer=https://example.com';

    console.log('1. Proxy Mode URL (correct):');
    console.log('   ', proxyURL);
    console.log('');

    console.log('2. Direct Mode URL (CORRECT - clean):');
    console.log('   ', cleanDirectURL);
    console.log('');

    console.log('3. Direct Mode URL (WRONG - with pipe headers):');
    console.log('   ', wrongDirectURL);
    console.log('');

    console.log('Analysis:');
    console.log('- Xtream players expect either:');
    console.log('  a) Proxy URL: /live/user/pass/streamid.ext');
    console.log('  b) Clean direct URL: https://cdn.com/stream.mpd');
    console.log('- They do NOT understand pipe syntax (|header=value)');
    console.log('- Pipe syntax is only for internal proxy header injection');
    console.log('');

    // Check server_info response
    console.log('=== Standard Xtream Server Info ===\n');
    const serverInfo = {
        url: host.split(':')[0],
        port: '443',
        https_port: '443',
        server_protocol: protocol,
        rtmp_port: '1935',
        timezone: 'Asia/Kolkata',
        timestamp_now: Math.floor(Date.now() / 1000),
        version: '2.9.1'
    };

    console.log(JSON.stringify(serverInfo, null, 2));
}

testXtreamURLs();
