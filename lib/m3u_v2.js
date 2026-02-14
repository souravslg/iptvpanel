export function parseM3U(content) {
    if (!content) return [];

    const lines = content.split('\n');
    const playlist = [];
    let currentItem = {
        headers: {}
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTM3U')) continue;

        if (line.startsWith('#KODIPROP:')) {
            const prop = line.substring(10).trim();
            // Handle KODIPROP:key=value
            const eqIndex = prop.indexOf('=');
            if (eqIndex !== -1) {
                const key = prop.substring(0, eqIndex).trim();
                const value = prop.substring(eqIndex + 1).trim();

                if (key === 'inputstream.adaptive.license_type') {
                    currentItem.drmScheme = value.toLowerCase();
                    if (currentItem.drmScheme === 'org.w3.clearkey') currentItem.drmScheme = 'clearkey';
                } else if (key === 'inputstream.adaptive.license_key') {
                    currentItem.drmLicenseUrl = value;

                    // Try to extract kid/key if in format kid:key
                    const clearKeyMatch = value.match(/([0-9a-fA-F]{32}):([0-9a-fA-F]{32})/);
                    if (clearKeyMatch) {
                        currentItem.drmKeyId = clearKeyMatch[1];
                        currentItem.drmKey = clearKeyMatch[2];
                        currentItem.drmScheme = 'clearkey';
                    }
                } else if (key === 'inputstream.adaptive.manifest_type') {
                    // mpd vs hls
                    currentItem.streamFormat = value.toLowerCase();
                } else if (key === 'inputstream.adaptive.stream_headers') {
                    // key=value&key2=value2
                    const pairs = value.split('&');
                    pairs.forEach(pair => {
                        const pEq = pair.indexOf('=');
                        if (pEq !== -1) {
                            const k = pair.substring(0, pEq).trim();
                            const v = pair.substring(pEq + 1).trim();
                            currentItem.headers[k] = v;
                        }
                    });
                }
            }

        } else if (line.startsWith('#EXTINF:')) {
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');
            const metaPart = (commaIndex !== -1) ? info.substring(0, commaIndex) : info;
            const name = (commaIndex !== -1) ? info.substring(commaIndex + 1).trim() : 'Unknown';

            // Helprt to get attribute
            const getAttr = (attr) => {
                let match = metaPart.match(new RegExp(`${attr}=\\"([^\\"]*)\\"`, 'i'));
                if (match) return match[1];
                match = metaPart.match(new RegExp(`${attr}=([^\\s]+)`, 'i'));
                return match ? match[1] : '';
            };

            currentItem.name = name;
            currentItem.id = getAttr('tvg-id') || getAttr('tvg-ID') || null;
            currentItem.logo = getAttr('tvg-logo');
            currentItem.group = getAttr('group-title');
            currentItem.channelNumber = getAttr('tvg-chno') || null;

        } else if (line.startsWith('#EXTVLCOPT:')) {
            const opt = line.substring(11).trim();
            const eq = opt.indexOf('=');
            if (eq !== -1) {
                const k = opt.substring(0, eq).trim();
                const v = opt.substring(eq + 1).trim();
                if (k === 'http-user-agent') currentItem.headers['User-Agent'] = v;
                else if (k === 'http-referrer') currentItem.headers['Referer'] = v;
            }

        } else if (!line.startsWith('#')) {
            // URL line
            let finalUrl = line;

            // Check for pipe headers: URL|Header1=Value1&Header2=Value2
            // Also handle encoded pipe %7C
            let pipeIndex = line.indexOf('|');
            if (pipeIndex === -1) pipeIndex = line.indexOf('%7C');

            if (pipeIndex !== -1) {
                finalUrl = line.substring(0, pipeIndex);
                const separator = line.includes('|') ? '|' : '%7C';
                const headerString = line.substring(pipeIndex + separator.length);

                // Parse headers string
                const headerPairs = headerString.split('&');
                for (const pair of headerPairs) {
                    const eqIndex = pair.indexOf('=');
                    if (eqIndex !== -1) {
                        const key = pair.substring(0, eqIndex);
                        const val = pair.substring(eqIndex + 1);
                        currentItem.headers[key] = val;
                    }
                }
            }

            currentItem.url = finalUrl;

            // Infer format from URL if not set
            if (!currentItem.streamFormat) {
                if (finalUrl.includes('.mpd')) currentItem.streamFormat = 'mpd';
                else if (finalUrl.includes('.m3u8')) currentItem.streamFormat = 'hls';
            }

            // Fallback ID
            if (!currentItem.id) {
                currentItem.id = Math.floor(Math.random() * 1000000000).toString();
            }

            // Push to playlist
            if (currentItem.name && currentItem.url) {
                // Ensure headers is null if empty (cleaner for DB)
                if (Object.keys(currentItem.headers).length === 0) currentItem.headers = null;

                playlist.push({ ...currentItem });
            }

            // Reset for next item
            currentItem = {
                headers: {}
            };
        }
    }
    return playlist;
}

export function getStats(playlist) {
    const groups = {};
    playlist.forEach(item => {
        const g = item.group || 'Uncategorized';
        if (!groups[g]) groups[g] = 0;
        groups[g]++;
    });

    return {
        totalChannels: playlist.length,
        groups: Object.entries(groups).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        totalGroups: Object.keys(groups).length
    };
}
