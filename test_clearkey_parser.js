import { parseM3U } from './lib/m3u.js';

const testM3U = `#EXTM3U
#EXTINF:-1 tvg-id="1071" group-title="Education" tvg-logo="https://jiotv.catchup.cdn.jio.com/dare_images/images/Vande_Gujarat_4.png",Vande Gujarat 4
#KODIPROP:inputstream.adaptive.license_type=clearkey
#KODIPROP:inputstream.adaptive.license_key=https://aqfadtv.xyz/clearkey/results.php?keyid=9a630b4da72052259d047ad56e98e57f&key=6394df90d16cdaf75ec745fb9ccb80c0
#EXTVLCOPT:http-user-agent=plaYtv/7.1.3 (Linux;Android 13) ygx/824.1 ExoPlayerLib/824.0
#EXTHTTP:{"cookie":"__hdnea__=st=1770406322~exp=1770492722~acl=/*~hmac=4fa94b6c9e8c91770c3bbb06217e9627d7c2f305a05f718c3556b0df273c608b"}
https://jiotvbpkmob.cdn.jio.com/bpk-tv/Vande_Gujarat_4_BTS/output/index.mpd`;

console.log('🧪 Testing M3U Parser with ClearKey URL format...\n');

const result = parseM3U(testM3U);

if (result.length === 0) {
    console.log('❌ No channels parsed!');
} else {
    console.log('✅ Parsed', result.length, 'channel(s)\n');

    const channel = result[0];
    console.log('📺 Channel Details:');
    console.log('   Name:', channel.name);
    console.log('   Group:', channel.group);
    console.log('   URL:', channel.url);
    console.log('\n🔐 DRM Information:');
    console.log('   DRM Scheme:', channel.drmScheme || '(not extracted)');
    console.log('   License URL:', channel.drmLicenseUrl || '(not extracted)');
    console.log('   Key ID:', channel.drmKeyId || '(not extracted)');
    console.log('   Key:', channel.drmKey || '(not extracted)');
    console.log('   Stream Format:', channel.streamFormat || '(auto-detected from URL)');

    console.log('\n✅ Expected values:');
    console.log('   DRM Scheme: clearkey');
    console.log('   Key ID: 9a630b4da72052259d047ad56e98e57f');
    console.log('   Key: 6394df90d16cdaf75ec745fb9ccb80c0');

    if (channel.drmScheme === 'clearkey' &&
        channel.drmKeyId === '9a630b4da72052259d047ad56e98e57f' &&
        channel.drmKey === '6394df90d16cdaf75ec745fb9ccb80c0') {
        console.log('\n🎉 SUCCESS! All DRM fields extracted correctly!');
    } else {
        console.log('\n❌ FAILED! DRM fields not matching expected values.');
    }
}
