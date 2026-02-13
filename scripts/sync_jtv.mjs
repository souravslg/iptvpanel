
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse utility (copied from lib/m3u_v2.js for simplicity in standalone script)
function parseM3U(content) {
    if (!content) return [];
    const lines = content.split('\n');
    const playlist = [];
    let currentItem = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');
            const metaPart = info.substring(0, commaIndex);
            const name = info.substring(commaIndex + 1).trim();
            const getAttr = (attr) => {
                let match = metaPart.match(new RegExp(`${attr}=\\"([^\\"]*)\\"`, 'i'));
                if (match) return match[1];
                match = metaPart.match(new RegExp(`${attr}=([^\\s]+)`, 'i'));
                return match ? match[1] : '';
            };
            const drmScheme = getAttr('drm-scheme') || getAttr('drm') || getAttr('drmscheme') || '';
            const drmLicenseUrl = getAttr('drm-license-url') || getAttr('license-url') || getAttr('drmlicenseurl') || getAttr('licenseurl') || '';
            const drmKeyId = getAttr('drm-key-id') || getAttr('key-id') || getAttr('drmkeyid') || getAttr('keyid') || '';
            const drmKey = getAttr('drm-key') || getAttr('key') || getAttr('drmkey') || '';
            const streamFormat = getAttr('stream-format') || getAttr('format') || getAttr('streamformat') || '';
            const channelNumber = getAttr('tvg-chno') || getAttr('channel-number') || getAttr('channelnumber') || getAttr('chno') || '';

            currentItem = {
                ...currentItem, // Preserve headers parsed before EXTINF
                id: getAttr('tvg-id') || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: name || getAttr('tvg-name') || 'Unknown Channel',
                logo: getAttr('tvg-logo'),
                group: getAttr('group-title') || 'Uncategorized',
                drmScheme: drmScheme || currentItem.drmScheme || null,
                drmLicenseUrl: drmLicenseUrl || currentItem.drmLicenseUrl || null,
                drmKeyId: drmKeyId || currentItem.drmKeyId || null,
                drmKey: drmKey || currentItem.drmKey || null,
                streamFormat: streamFormat || currentItem.streamFormat || null,
                channelNumber: channelNumber ? parseInt(channelNumber) : (currentItem.channelNumber || null)
            };
        } else if (line.startsWith('#EXTHTTP:')) {
            try {
                const jsonStr = line.substring(9).trim();
                const headers = JSON.parse(jsonStr);
                if (!currentItem.headers) currentItem.headers = {};
                Object.assign(currentItem.headers, headers);
            } catch (e) {
                console.warn('Failed to parse EXTHTTP:', e);
            }
        } else if (line.startsWith('#KODIPROP:')) {
            // Simplified KODIPROP parsing, add more if needed
            const prop = line.substring(10).trim();
            if (prop.includes('=')) {
                const [key, value] = prop.split('=').map(s => s.trim());
                if (key === 'inputstream.adaptive.license_type') {
                    currentItem.drmScheme = value.toLowerCase() === 'org.w3.clearkey' ? 'clearkey' : value.toLowerCase();
                } else if (key === 'inputstream.adaptive.license_key') {
                    const clearKeyMatch = value.match(/([0-9a-fA-F]{32}):([0-9a-fA-F]{32})/);
                    if (clearKeyMatch) {
                        currentItem.drmKeyId = clearKeyMatch[1];
                        currentItem.drmKey = clearKeyMatch[2];
                        currentItem.drmScheme = 'clearkey';
                    } else if (value.startsWith('http')) {
                        currentItem.drmLicenseUrl = value;
                    }
                }
            }
        } else if (line.startsWith('http') || line.startsWith('rtmp') || (line.length > 0 && !line.startsWith('#'))) {
            if (currentItem.name) {
                currentItem.url = line;
                playlist.push({ ...currentItem });
                currentItem = {};
            }
        }
    }
    return playlist;
}

// Main logic
async function main() {
    // Read env vars manually since we are outside Next.js
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const getEnv = (key) => {
        const line = envContent.split('\n').find(l => l.startsWith(key + '='));
        return line ? line.split('=')[1].trim().replace(/^"|"$/g, '') : null;
    };

    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching playlist...');
    const url = 'https://raw.githubusercontent.com/MaskedWolff/jtv/refs/heads/main/merged.m3u';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const content = await res.text();
    console.log(`Fetched ${content.length} bytes.`);

    console.log('Parsing M3U...');
    const playlist = parseM3U(content);
    console.log(`Found ${playlist.length} channels.`);

    // Get Active Playlist ID
    let { data: activePlaylists } = await supabase.from('playlists').select('id').eq('is_active', true).limit(1);
    let playlistId = activePlaylists?.[0]?.id;

    if (!playlistId) {
        console.log('No active playlist, creating one...');
        const newPl = await supabase.from('playlists').insert([{ name: 'JTV Main', is_active: true }]).select().single();
        playlistId = newPl.data.id;
    } else {
        console.log(`Using active playlist ID: ${playlistId}`);
        // Optional: clear existing streams for this playlist?
        // User said "use this source", implying replacement.
        console.log('Clearing existing streams for this playlist...');
        await supabase.from('streams').delete().eq('playlist_id', playlistId);
    }

    console.log('Inserting channels...');
    const chunkSize = 100;
    for (let i = 0; i < playlist.length; i += chunkSize) {
        const chunk = playlist.slice(i, i + chunkSize).map(stream => ({
            stream_id: `jtv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: stream.name,
            url: stream.url,
            logo: stream.logo,
            category: stream.group,
            playlist_id: playlistId,
            type: 'live', // Default
            drm_scheme: stream.drmScheme || null,
            drm_license_url: stream.drmLicenseUrl || null,
            drm_key_id: stream.drmKeyId || null,
            drm_key: stream.drmKey || null,
            stream_format: stream.streamFormat || 'hls',
            channel_number: stream.channelNumber || null,
            headers: stream.headers ? JSON.stringify(stream.headers) : null,
            enabled: true
        }));

        const { error } = await supabase.from('streams').insert(chunk);
        if (error) {
            console.error('Error inserting chunk:', error);
        } else {
            console.log(`Inserted ${i + chunk.length}/${playlist.length}`);
        }
    }

    console.log('Done!');
}

main().catch(console.error);
