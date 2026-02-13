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
        let url = line;

        // Extract existing params from the URL if present
        let existingParams = {};
        if (url.includes('|')) {
            const parts = url.split('|');
            url = parts[0]; // Base URL
            const paramStr = parts[1];

            // Parse key=value pairs from the pipe block
            // They might be separated by & (standard) or just appended
            const pairs = paramStr.split('&');
            pairs.forEach(pair => {
                const [key, val] = pair.split('=');
                if (key && val) {
                    existingParams[key] = decodeURIComponent(val);
                }
            });
        }

        // Smart encode function: Encodes spaces and special chars but keeps structure chars like = / : ,
        const smartEncode = (str) => {
            return encodeURIComponent(str)
                .replace(/%3D/g, '=')  // Keep = for key=value
                .replace(/%2F/g, '/')  // Keep / for paths/UA
                .replace(/%3A/g, ':')  // Keep : 
                .replace(/%2C/g, ',')  // Keep ,
                .replace(/%3B/g, ';')  // Keep ;
                .replace(/%7E/g, '~'); // Keep ~ (common in tokens)
        };

        const params = [];

        // 1. DRM Params (TiviMate often expects these in the | block if they are player-specific)
        if (pendingDrm) {
            params.push(`drmScheme=clearkey`);
            params.push(`drmLicense=${pendingDrm.keyId}:${pendingDrm.key}`);
            pendingDrm = null;
        }

        // 2. HTTP Headers & Other Params
        // Prioritize pending headers (from tags), fallback to existing URL params

        // Cookie
        let cookieVal = pendingCookie || existingParams['Cookie'];
        if (cookieVal) {
            params.push(`Cookie=${smartEncode(cookieVal)}`);
            pendingCookie = null;
        }

        // User-Agent
        let uaVal = pendingUserAgent || existingParams['User-Agent'] || existingParams['User-agent'];
        if (uaVal) {
            params.push(`User-Agent=${smartEncode(uaVal)}`);
            pendingUserAgent = null;
        }

        // Preserve other existing params (like Referer, Origin) if found
        Object.keys(existingParams).forEach(key => {
            if (key !== 'Cookie' && key !== 'User-Agent' && key !== 'User-agent' && key !== 'drmScheme' && key !== 'drmLicense') {
                params.push(`${key}=${smartEncode(existingParams[key])}`);
            }
        });

        // 3. Inject Missing Defaults for JioTV
        if (url.includes('jio.com') || url.includes('jiotv')) {
            if (!existingParams['Referer']) {
                params.push(`Referer=${smartEncode('https://jiotv.com/')}`);
            }
            if (!existingParams['Origin']) {
                params.push(`Origin=${smartEncode('https://jiotv.com')}`);
            }
        }

        // Append all parameters after a single pipe '|'
        if (params.length > 0) {
            url = url + '|' + params.join('&');
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
