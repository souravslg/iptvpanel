export function parseM3U(content) {
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
                ...currentItem,
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

        } else if (line.startsWith('#EXTVLCOPT:')) {
            const option = line.substring(11).trim();
            if (option.includes('=')) {
                const [key, value] = option.split('=').map(s => s.trim());
                if (key === 'http-user-agent') {
                    if (!currentItem.headers) currentItem.headers = {};
                    currentItem.headers['User-Agent'] = value;
                } else if (key.toLowerCase().includes('drm')) {
                    if (key.toLowerCase().includes('license')) {
                        currentItem.drmLicenseUrl = value;
                    } else if (key.toLowerCase().includes('scheme')) {
                        currentItem.drmScheme = value;
                    }
                }
            }
        } else if (line.startsWith('#KODIPROP:')) {
            const prop = line.substring(10).trim();
            if (prop.includes('=')) {
                const equalsIndex = prop.indexOf('=');
                const key = prop.substring(0, equalsIndex).trim();
                const value = prop.substring(equalsIndex + 1).trim();
                if (key === 'inputstream.adaptive.license_type') {
                    currentItem.drmScheme = value.toLowerCase();
                    if (currentItem.drmScheme === 'org.w3.clearkey') currentItem.drmScheme = 'clearkey';
                } else if (key === 'inputstream.adaptive.license_key') {
                    const clearKeyMatch = value.match(/([0-9a-fA-F]{32}):([0-9a-fA-F]{32})/);
                    if (clearKeyMatch) {
                        currentItem.drmKeyId = clearKeyMatch[1];
                        currentItem.drmKey = clearKeyMatch[2];
                        currentItem.drmScheme = 'clearkey';
                    } else if (value.includes('|')) {
                        const parts = value.split('|');
                        currentItem.drmLicenseUrl = parts[0];
                    } else if (value.startsWith('http')) {
                        currentItem.drmLicenseUrl = value;
                    }
                    try {
                        let urlStr = currentItem.drmLicenseUrl || value;
                        if (urlStr && urlStr.startsWith('http')) {
                            const url = new URL(urlStr);
                            const keyid = url.searchParams.get('keyid') || url.searchParams.get('kid');
                            const keyValue = url.searchParams.get('key') || url.searchParams.get('k');
                            if (keyid) currentItem.drmKeyId = keyid;
                            if (keyValue) currentItem.drmKey = keyValue;
                        }
                    } catch (e) { }
                } else if (key === 'inputstream.adaptive.manifest_type') {
                    if (value.toLowerCase() === 'mpd') {
                        currentItem.streamFormat = 'mpd';
                    } else if (value.toLowerCase() === 'hls') {
                        currentItem.streamFormat = 'hls';
                    }
                }
            }
        } else if (line.startsWith('#EXTHTTP:')) {
            try {
                const jsonStr = line.substring(9).trim();
                const headers = JSON.parse(jsonStr);
                if (!currentItem.headers) currentItem.headers = {};
                Object.entries(headers).forEach(([key, value]) => {
                    currentItem.headers[key] = value;
                });
            } catch (e) {
                console.warn('Failed to parse EXTHTTP:', e);
            }
        } else if (line.startsWith('http') || line.startsWith('rtmp') || (line.length > 0 && !line.startsWith('#'))) {
            if (currentItem.name) {
                let pipeIndex = line.indexOf('|');
                if (pipeIndex === -1) pipeIndex = line.indexOf('%7C');
                let cleanUrl = line;
                let headers = {};
                if (pipeIndex !== -1) {
                    cleanUrl = line.substring(0, pipeIndex);
                    const separator = line.includes('|') ? '|' : '%7C';
                    const headerPart = line.substring(pipeIndex + separator.length);
                    const headerPairs = headerPart.split('&');
                    headerPairs.forEach(pair => {
                        const eqIdx = pair.indexOf('=');
                        if (eqIdx !== -1) {
                            const key = pair.substring(0, eqIdx).trim();
                            const val = pair.substring(eqIdx + 1).trim();
                            headers[key] = val;
                        }
                    });
                }
                currentItem.url = cleanUrl;
                if (Object.keys(headers).length > 0) {
                    if (!currentItem.headers) currentItem.headers = {};
                    Object.assign(currentItem.headers, headers);
                }
                if (!currentItem.streamFormat) {
                    if (cleanUrl.includes('.mpd')) currentItem.streamFormat = 'mpd';
                    else if (cleanUrl.includes('.m3u8')) currentItem.streamFormat = 'hls';
                    else if (cleanUrl.startsWith('rtmp')) currentItem.streamFormat = 'rtmp';
                    else if (cleanUrl.includes('.ts')) currentItem.streamFormat = 'ts';
                }
                playlist.push({ ...currentItem });
                currentItem = {};
            }
        }
    }
    return playlist;
}

export function getStats(playlist) {
    const groups = {};
    playlist.forEach(item => {
        if (!groups[item.group]) groups[item.group] = 0;
        groups[item.group]++;
    });

    return {
        totalChannels: playlist.length,
        groups: Object.entries(groups).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        totalGroups: Object.keys(groups).length
    };
}
