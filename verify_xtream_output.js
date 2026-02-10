// Native fetch used

const BASE = 'http://localhost:3000';
const CRED = 'username=121&password=121';

async function verify() {
    console.log('--- Verifying Xtream API ---');

    // 1. Check player_api.php (get_live_streams)
    try {
        const res = await fetch(`${BASE}/api/player_api?${CRED}&action=get_live_streams`);
        if (!res.ok) throw new Error(`player_api failed: ${res.status}`);
        const data = await res.json();

        console.log(`[player_api] Received ${data.length} streams`);

        if (data.length > 0) {
            const firstStream = data[0];
            console.log('[player_api] First Stream Source Check:', firstStream.direct_source);

            // Debug: Check specific known DRM stream
            const knownDrmStream = data.find(s => s.stream_id == 18890 || s.num == 18890);
            if (knownDrmStream) {
                console.log('[player_api] Found Known DRM Stream (18890):');
                console.log('  - drm_key_id:', knownDrmStream.drm_key_id);
                console.log('  - drm_scheme:', knownDrmStream.drm_scheme);
                if (/^[0-9a-fA-F]+$/.test(knownDrmStream.drm_key_id)) {
                    console.log('[PASS] Known DRM Key ID is Hex');
                } else {
                    console.log('[WARN] Known DRM Key ID might be Base64/Base64URL:', knownDrmStream.drm_key_id);
                }
            } else {
                console.log('[WARN] Known DRM stream 18890 NOT found in response');
            }

            // Find ANY stream with DRM to check format
            const drmStream = data.find(s => s.drm_key_id);
            if (drmStream) {
                console.log('[player_api] Found Generic DRM Stream:', drmStream.name);
                console.log('[player_api] DRM Key ID:', drmStream.drm_key_id);
                // Check if likely Hex (not Base64URL)
                if (/^[0-9a-fA-F]+$/.test(drmStream.drm_key_id)) {
                    console.log('[PASS] DRM Key ID is Hex');
                } else {
                    console.log('[WARN] DRM Key ID might be Base64/Base64URL:', drmStream.drm_key_id);
                }
            } else {
                console.log('[INFO] No streams with DRM keys found in response');
            }
        } else {
            console.log('[WARN] No streams returned from player_api');
        }
    } catch (e) {
        console.error('[none] player_api error:', e.message);
    }

    // 2. Check get.php (output=ts)
    try {
        const res = await fetch(`${BASE}/api/get?${CRED}&output=ts`);
        const text = await res.text();
        const lines = text.split('\n');
        const urlLine = lines.find(l => l.startsWith('http'));

        console.log('[get.php?output=ts] Sample URL:', urlLine);
        if (urlLine && urlLine.includes('.ts')) {
            console.log('[PASS] get.php respects output=ts');
        } else {
            console.log('[FAIL] get.php incorrect extension (expected .ts)');
        }
    } catch (e) {
        console.error('[none] get.php error:', e.message);
    }

    // 3. Check get.php (output=m3u8)
    try {
        const res = await fetch(`${BASE}/api/get?${CRED}&output=m3u8`);
        const text = await res.text();
        const lines = text.split('\n');
        const urlLine = lines.find(l => l.startsWith('http'));

        console.log('[get.php?output=m3u8] Sample URL:', urlLine);
        if (urlLine && urlLine.includes('.m3u8')) {
            console.log('[PASS] get.php respects output=m3u8');
        } else {
            console.log('[FAIL] get.php incorrect extension (expected .m3u8)');
        }
    } catch (e) {
        console.error('[none] get.php error:', e.message);
    }
}

verify();
