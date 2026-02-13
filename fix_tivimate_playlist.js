const fs = require('fs');

// Read the current playlist
const inputFile = 'current_playlist.m3u';
const outputFile = 'tivimate.m3u';

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

const fixedLines = [];
let pendingCookie = null;
let pendingUserAgent = null;
let pendingDrm = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if it's an EXTHTTP line (Cookies)
    if (line.startsWith('#EXTHTTP:')) {
        try {
            const jsonStr = line.replace('#EXTHTTP:', '');
            const headers = JSON.parse(jsonStr);
            if (headers.cookie) {
                pendingCookie = headers.cookie;
            }
        } catch (e) {
            console.error('Failed to parse EXTHTTP:', line);
        }
        continue; // Remove EXTHTTP for TiviMate
    }

    // Check if it's an EXTVLCOPT line (User-Agent)
    if (line.startsWith('#EXTVLCOPT:')) {
        if (line.includes('http-user-agent=')) {
            pendingUserAgent = line.split('http-user-agent=')[1];
        }
        continue; // Remove EXTVLCOPT for TiviMate
    }

    // Check if it's a KODIPROP line (DRM)
    if (line.startsWith('#KODIPROP:inputstream.adaptive.license_key=')) {
        // Extract keyid and key from the URL
        // Format: ...?keyid=HEX&key=HEX
        const licenseUrl = line.split('license_key=')[1];
        const keyIdMatch = licenseUrl.match(/keyid=([a-fA-F0-9]+)/);
        const keyMatch = licenseUrl.match(/[?&]key=([a-fA-F0-9]+)/);

        if (keyIdMatch && keyMatch) {
            pendingDrm = {
                keyId: keyIdMatch[1],
                key: keyMatch[1]
            };
        }
        continue; // TiviMate doesn't use KODIPROP
    }

    // Check if it's an EXTINF line
    if (line.startsWith('#EXTINF:')) {
        fixedLines.push(line);
        continue;
    }

    // Check if it's a URL line
    if (line && !line.startsWith('#')) {
        let url = line.split('|')[0]; // Strip existing pipe

        // Extract existing params from the URL if present (to handle re-runs or pre-existing pipes)
        let existingParams = {};
        if (line.includes('|')) {
            const paramStr = line.split('|')[1];
            const pairs = paramStr.split('&');
            pairs.forEach(pair => {
                const [key, val] = pair.split('=');
                if (key && val) {
                    existingParams[key] = decodeURIComponent(val);
                }
            });
        }

        // Smart encode function V2 (Preserve * and ())
        const smartEncode = (str) => {
            return encodeURIComponent(str)
                .replace(/%3D/g, '=')
                .replace(/%2F/g, '/')
                .replace(/%3A/g, ':')
                .replace(/%2C/g, ',')
                .replace(/%3B/g, ';')
                .replace(/%7E/g, '~')
                .replace(/%2A/g, '*')
                .replace(/%28/g, '(')
                .replace(/%29/g, ')');
        };

        const queryParams = [];
        const headerParams = [];

        // 1. DRM Params -> URL Query (?/&)
        if (pendingDrm) {
            queryParams.push(`drmScheme=clearkey`);
            queryParams.push(`drmLicense=${pendingDrm.keyId}:${pendingDrm.key}`);
            pendingDrm = null;
        }

        // 2. Headers -> Pipe (|)

        // Cookie
        let cookieVal = pendingCookie || existingParams['Cookie'];
        if (cookieVal) {
            headerParams.push(`Cookie=${smartEncode(cookieVal)}`);
            pendingCookie = null;
        }

        // User-agent (Match Hotstar casing)
        let uaVal = pendingUserAgent || existingParams['User-Agent'] || existingParams['User-agent'] || existingParams['user-agent'];
        if (uaVal) {
            headerParams.push(`User-agent=${smartEncode(uaVal)}`);
            pendingUserAgent = null;
        }

        // Inject Missing Defaults for JioTV (Referer/Origin)
        if (url.includes('jio.com') || url.includes('jiotv')) {
            let hasReferer = existingParams['Referer'] || existingParams['referer'];
            if (!hasReferer) {
                headerParams.push(`Referer=${smartEncode('https://jiotv.com/')}`);
            }

            let hasOrigin = existingParams['Origin'] || existingParams['origin'];
            if (!hasOrigin) {
                headerParams.push(`Origin=${smartEncode('https://jiotv.com')}`);
            }
        }

        // Preserve other existing params (map to headers or query?)
        // Assume existing pipe params were headers
        Object.keys(existingParams).forEach(key => {
            if (!['Cookie', 'User-Agent', 'User-agent', 'user-agent', 'Referer', 'Origin', 'drmScheme', 'drmLicense'].includes(key)) {
                headerParams.push(`${key}=${smartEncode(existingParams[key])}`);
            }
        });

        // Construct Final URL
        // Append Query Params
        if (queryParams.length > 0) {
            const separator = url.includes('?') ? '&' : '?';
            url = url + separator + queryParams.join('&');
        }

        // Append Header Params
        if (headerParams.length > 0) {
            url = url + '|' + headerParams.join('&');
        }

        fixedLines.push(url);
        continue;
    }

    // KODIPROP tags - Keep them for now as some players might use them, 
    // or TiviMate might support them in future. 
    // (Optional: could also append license keys to URL if TiviMate supports that specific format)
    // For now, we just pass them through.

    // Pass through all other lines
    if (line || lines[i] === '') {
        fixedLines.push(lines[i]);
    }
}

// Write the fixed playlist
fs.writeFileSync(outputFile, fixedLines.join('\n'), 'utf-8');

console.log(`✅ Fixed playlist saved to: ${outputFile}`);
console.log(`📊 Original lines: ${lines.length}`);
console.log(`📊 Fixed lines: ${fixedLines.length}`);
