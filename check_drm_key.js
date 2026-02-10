const BASE = 'http://localhost:3000';
const CRED = 'username=121&password=121';

async function verify() {
    try {
        const res = await fetch(`${BASE}/api/player_api?${CRED}&action=get_live_streams`);
        if (!res.ok) throw new Error(`player_api failed: ${res.status}`);
        const data = await res.json();

        const s = data.find(x => x.stream_id == 18890 || x.num == 18890);
        if (s) {
            console.log('Stream 18890 Found');
            console.log('Key:', s.drm_key_id);
            if (/^[0-9a-fA-F]+$/.test(s.drm_key_id)) {
                console.log('PASS: Hex Format');
            } else {
                console.log('FAIL: Format is ' + s.drm_key_id);
            }
        } else {
            console.log('Stream 18890 NOT found');
        }
    } catch (e) {
        console.error(e);
    }
}
verify();
