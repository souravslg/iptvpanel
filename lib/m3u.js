export function parseM3UV2(content) {
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
                ...currentItem, // Preserve existing data (e.g. KODIPROP read before EXTINF)
                id: getAttr('tvg-id') || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: name || getAttr('tvg-name') || 'Unknown Channel',
                logo: getAttr('tvg-logo'),
                group: getAttr('group-title') || 'Uncategorized',
                // DRM fields (prioritize EXTINF attrs, but keep existing if not present)
                drmScheme: drmScheme || currentItem.drmScheme || null,
                drmLicenseUrl: drmLicenseUrl || currentItem.drmLicenseUrl || null,
                drmKeyId: drmKeyId || currentItem.drmKeyId || null,
                drmKey: drmKey || currentItem.drmKey || null,
                // Stream format
                streamFormat: streamFormat || currentItem.streamFormat || null,
                channelNumber: channelNumber ? parseInt(channelNumber) : (currentItem.channelNumber || null)
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
            // Parse Kodi properties which often contain DRM info
            const prop = line.substring(10).trim();

            if (prop.includes('=')) {
                const equalsIndex = prop.indexOf('=');
                const key = prop.substring(0, equalsIndex).trim();
                const value = prop.substring(equalsIndex + 1).trim();

                // Map Kodi properties to our DRM fields
                if (key === 'inputstream.adaptive.license_type') {
                    currentItem.drmScheme = value.toLowerCase();
                    if (currentItem.drmScheme === 'org.w3.clearkey') currentItem.drmScheme = 'clearkey';
                } else if (key === 'inputstream.adaptive.license_key') {
                    // Try to find raw ClearKey pattern: 32hex:32hex
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

                    // Also try to extract from URL params (fallback or if URL present)
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
                    // Determine stream format from manifest type
                    if (value.toLowerCase() === 'mpd') {
                        currentItem.streamFormat = 'mpd';
                    } else if (value.toLowerCase() === 'hls') {
                        currentItem.streamFormat = 'hls';
                    }
                }
            }
        } else if (line.startsWith('#EXTHTTP:')) {
            // Parse EXTHTTP which contains JSON headers (cookies, user-agent, etc.)
            try {
                const jsonStr = line.substring(9).trim();
                const headers = JSON.parse(jsonStr);

                if (!currentItem.headers) currentItem.headers = {};

                // Merge headers (case-insensitive keys if possible, but standard object for now)
                Object.entries(headers).forEach(([key, value]) => {
                    currentItem.headers[key] = value;
                });
            } catch (e) {
                console.warn('Failed to parse EXTHTTP:', e);
            }
        } else if (line.startsWith('http') || line.startsWith('rtmp') || (line.length > 0 && !line.startsWith('#'))) {
            // It's a URL
            if (currentItem.name) {
                // Check for pipe syntax for headers (e.g. |User-Agent=... or %7CUser-Agent=...)
                let pipeIndex = line.indexOf('|');
                if (pipeIndex === -1) pipeIndex = line.indexOf('%7C');

                let cleanUrl = line;
                let headers = {};

                if (pipeIndex !== -1) {
                    cleanUrl = line.substring(0, pipeIndex);
                    // Handle both | and %7C (length 1 vs 3)
                    const separator = line.includes('|') ? '|' : '%7C';
                    const headerPart = line.substring(pipeIndex + separator.length);

                    // Parse headers: Key=Value&Key2=Value2
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

                // Special handling for JTV cookies -> URL params
                if (currentItem.headers && (currentItem.headers.cookie || currentItem.headers.Cookie)) {
                    const cookie = currentItem.headers.cookie || currentItem.headers.Cookie;
                    if (cookie.includes('__hdnea__')) {
                        // Extract token: __hdnea__=value...
                        let token = '';
                        if (cookie.trim().startsWith('__hdnea__=')) {
                            const parts = cookie.split(';');
                            const tokenPart = parts.find(p => p.trim().startsWith('__hdnea__='));
                            if (tokenPart) token = tokenPart.trim();
                        } else {
                            const match = cookie.match(/(__hdnea__=[^;]+)/);
                            if (match) token = match[1];
                        }

                        if (token) {
                            if (currentItem.url.includes('?')) {
                                if (!currentItem.url.includes('__hdnea__=')) {
                                    currentItem.url += `&${token}`;
                                }
                            } else {
                                currentItem.url += `?${token}`;
                            }
                            // Remove cookie from headers
                            delete currentItem.headers.cookie;
                            delete currentItem.headers.Cookie;
                            if (Object.keys(currentItem.headers).length === 0) currentItem.headers = null;
                        }
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
