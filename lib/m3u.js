export function parseM3U(content) {
    if (!content) return [];

    const lines = content.split('\n');
    const playlist = [];
    let currentItem = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');

            const metaPart = info.substring(0, commaIndex);
            const name = info.substring(commaIndex + 1).trim();

            // Extract attributes using regex - handles both quoted and unquoted values
            const getAttr = (attr) => {
                // Try quoted value first: attr="value"
                let match = metaPart.match(new RegExp(`${attr}=\\"([^\\"]*)\\"`, 'i'));
                if (match) return match[1];

                // Try unquoted value: attr=value (stops at space or end)
                match = metaPart.match(new RegExp(`${attr}=([^\\s]+)`, 'i'));
                return match ? match[1] : '';
            };

            // Extract DRM scheme from various possible attributes
            const drmScheme = getAttr('drm-scheme') || getAttr('drm') || getAttr('drmscheme') || '';
            const drmLicenseUrl = getAttr('drm-license-url') || getAttr('license-url') || getAttr('drmlicenseurl') || getAttr('licenseurl') || '';
            const drmKeyId = getAttr('drm-key-id') || getAttr('key-id') || getAttr('drmkeyid') || getAttr('keyid') || '';
            const drmKey = getAttr('drm-key') || getAttr('key') || getAttr('drmkey') || '';
            const streamFormat = getAttr('stream-format') || getAttr('format') || getAttr('streamformat') || '';
            const channelNumber = getAttr('tvg-chno') || getAttr('channel-number') || getAttr('channelnumber') || getAttr('chno') || '';

            currentItem = {
                id: getAttr('tvg-id') || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: name || getAttr('tvg-name') || 'Unknown Channel',
                logo: getAttr('tvg-logo'),
                group: getAttr('group-title') || 'Uncategorized',
                // DRM fields
                drmScheme: drmScheme || null,
                drmLicenseUrl: drmLicenseUrl || null,
                drmKeyId: drmKeyId || null,
                drmKey: drmKey || null,
                // Stream format
                streamFormat: streamFormat || null,
                channelNumber: channelNumber ? parseInt(channelNumber) : null
            };

        } else if (line.startsWith('#EXTVLCOPT:')) {
            // Parse VLC options which often contain DRM info
            const option = line.substring(11).trim();

            // Extract key-value pairs
            if (option.includes('=')) {
                const [key, value] = option.split('=').map(s => s.trim());

                // Map common VLC options to our DRM fields
                if (key === 'http-user-agent') {
                    // Store user agent if needed
                } else if (key.toLowerCase().includes('drm')) {
                    if (key.toLowerCase().includes('license')) {
                        currentItem.drmLicenseUrl = value;
                    } else if (key.toLowerCase().includes('scheme')) {
                        currentItem.drmScheme = value;
                    }
                }
            }
        } else if (line.startsWith('#KODIPROP:')) {
            // Parse Kodi properties which often contain DRM info
            const prop = line.substring(10).trim();

            if (prop.includes('=')) {
                const equalsIndex = prop.indexOf('=');
                const key = prop.substring(0, equalsIndex).trim();
                const value = prop.substring(equalsIndex + 1).trim();

                // Map Kodi properties to our DRM fields
                if (key === 'inputstream.adaptive.license_type') {
                    currentItem.drmScheme = value.toLowerCase();
                } else if (key === 'inputstream.adaptive.license_key') {
                    // License URL is before pipe
                    const licenseUrl = value.split('|')[0];
                    currentItem.drmLicenseUrl = licenseUrl;

                    // Extract key ID and key from URL parameters if present
                    // Format: https://example.com/clearkey/results.php?keyid=xxx&key=yyy
                    try {
                        const url = new URL(licenseUrl);
                        const keyid = url.searchParams.get('keyid') || url.searchParams.get('kid');
                        const keyValue = url.searchParams.get('key') || url.searchParams.get('k');

                        if (keyid) {
                            currentItem.drmKeyId = keyid;
                        }
                        if (keyValue) {
                            currentItem.drmKey = keyValue;
                        }
                    } catch (e) {
                        // If URL parsing fails, just keep the license URL
                        console.log('Could not parse license URL for key extraction:', e.message);
                    }
                } else if (key === 'inputstream.adaptive.stream_headers') {
                    // Store headers if needed
                } else if (key === 'inputstream.adaptive.manifest_type') {
                    // Determine stream format from manifest type
                    if (value.toLowerCase() === 'mpd') {
                        currentItem.streamFormat = 'mpd';
                    } else if (value.toLowerCase() === 'hls') {
                        currentItem.streamFormat = 'hls';
                    }
                }
            }
        } else if (line.startsWith('http') || line.startsWith('rtmp') || (line.length > 0 && !line.startsWith('#'))) {
            // It's a URL
            if (currentItem.name) {
                // Check for pipe syntax for headers (e.g. |User-Agent=...)
                const pipeIndex = line.indexOf('|');
                let cleanUrl = line;
                let headers = {};

                if (pipeIndex !== -1) {
                    cleanUrl = line.substring(0, pipeIndex);
                    const headerPart = line.substring(pipeIndex + 1);

                    // Parse headers: Key=Value&Key2=Value2
                    const headerPairs = headerPart.split('&');
                    headerPairs.forEach(pair => {
                        const eqIdx = pair.indexOf('=');
                        if (eqIdx !== -1) {
                            const key = pair.substring(0, eqIdx).trim();
                            const val = pair.substring(eqIdx + 1).trim();
                            // Decode value if needed, but usually kept raw in this syntax
                            headers[key] = val;
                        }
                    });
                }

                currentItem.url = cleanUrl;
                currentItem.headers = Object.keys(headers).length > 0 ? headers : null;

                // Auto-detect stream format from URL if not already set
                if (!currentItem.streamFormat) {
                    if (cleanUrl.includes('.mpd')) {
                        currentItem.streamFormat = 'mpd';
                    } else if (cleanUrl.includes('.m3u8')) {
                        currentItem.streamFormat = 'hls';
                    } else if (cleanUrl.startsWith('rtmp')) {
                        currentItem.streamFormat = 'rtmp';
                    } else if (cleanUrl.includes('.ts')) {
                        currentItem.streamFormat = 'ts';
                    }
                }

                playlist.push({ ...currentItem });
                currentItem = {}; // Reset
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
