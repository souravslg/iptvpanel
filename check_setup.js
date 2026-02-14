
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const results = {};
    console.log('--- Checking Setup ---');

    // 1. Check Stream Mode
    const { data: modeData, error: modeError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();

    const streamMode = modeData?.value || 'proxy (default)';
    results.stream_mode = streamMode;

    // 2. Get an active playlist and stream
    const { data: playlists } = await supabase.from('playlists').select('id').eq('is_active', true).limit(1);
    const playlistId = playlists?.[0]?.id;

    if (!playlistId) {
        results.error = 'No active playlists found.';
        fs.writeFileSync('check_result.json', JSON.stringify(results, null, 2));
        return;
    }

    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .eq('playlist_id', playlistId)
        .limit(1);

    if (!streams || streams.length === 0) {
        results.error = 'No streams found in active playlist.';
        fs.writeFileSync('check_result.json', JSON.stringify(results, null, 2));
        return;
    }

    const stream = streams[0];
    const streamId = stream.stream_id || stream.id?.toString();

    results.stream = {
        id: streamId,
        name: stream.name,
        url: stream.url,
        headers: stream.headers
    };

    // 3. Simulate Logic
    console.log('\n--- Simulation ---');

    // Logic from live/route.js
    let targetUrl = stream.url ? stream.url.replace(/\s/g, '').trim() : '';

    // Prepare Headers
    const fetchHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (stream.headers) {
        const storedHeaders = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
        const getStored = (k) => storedHeaders[k] || storedHeaders[k.toLowerCase()];
        if (getStored('User-Agent')) fetchHeaders['User-Agent'] = getStored('User-Agent');
        if (getStored('Referer')) fetchHeaders['Referer'] = getStored('Referer');
        if (getStored('Origin')) fetchHeaders['Origin'] = getStored('Origin');
        if (getStored('Cookie')) fetchHeaders['Cookie'] = getStored('Cookie');
    }

    // Dynamic Source Simulation (Mocking the effect)
    if (streamId && streamId.startsWith('tataplay-')) {
        results.isDynamic = true;
        // Mock headers that TataPlay would return
        Object.assign(fetchHeaders, { 'Cookie': 'mock-cookie', 'User-Agent': 'mock-ua' });
    }
    if (streamId && streamId.startsWith('sonyliv-')) {
        results.isDynamic = true;
        // Mock headers
        Object.assign(fetchHeaders, { 'Cookie': 'mock-cookie' });
    }

    results.fetchHeaders = fetchHeaders;
    const hasCustomHeaders = Object.keys(fetchHeaders).length > 1;

    if (streamMode === 'direct' || streamMode === 'redirect') {
        if (hasCustomHeaders) {
            results.action = 'proxy (smart override)';
            results.message = 'Smart Proxy: Stream has custom headers, FORCING PROXY mode.';
        } else {
            results.action = 'redirect';
            results.redirectUrl = targetUrl;
        }
    } else {
        results.action = 'proxy';
    }

    // Logic from player_api/route.js (Smart Proxy)
    let extension = 'ts'; // default
    let servedUrl = `http://localhost/live/user/pass/${streamId}.${extension}`; // Proxy URL default

    if (streamMode === 'direct') {
        let isComplex = false;
        if (stream.headers) {
            const h = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;
            if (Object.keys(h).length > 0) isComplex = true;
        }

        if (!isComplex) {
            const sIdStr = streamId ? streamId.toString() : '';
            if (sIdStr.startsWith('tataplay-') || sIdStr.startsWith('sonyliv-') || sIdStr.startsWith('zee5-')) {
                isComplex = true;
            }
        }

        results.isComplex = isComplex;

        if (!isComplex) {
            results.apiMode = 'Direct (Raw URL)';
            servedUrl = targetUrl;
        } else {
            results.apiMode = 'Proxy (Smart Fallback)';
            // servedUrl remains proxy
        }
    } else {
        results.apiMode = 'Proxy (Forced)';
    }

    results.servedUrl = servedUrl;

    fs.writeFileSync('check_result.json', JSON.stringify(results, null, 2));
    console.log('Results written to check_result.json');
}

check();
