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
        const params = [];

        // Pending Cookie
        if (pendingCookie) {
            params.push(`Cookie=${decodeURIComponent(pendingCookie)}`);
            pendingCookie = null;
        }

        // Pending User-Agent
        if (pendingUserAgent) {
            params.push(`User-Agent=${decodeURIComponent(pendingUserAgent)}`);
            pendingUserAgent = null;
        }

        // Pending DRM (ClearKey)
        if (pendingDrm) {
            params.push(`drmScheme=clearkey`);
            params.push(`drmLicense=${pendingDrm.keyId}:${pendingDrm.key}`);
            pendingDrm = null;
        }

        // Append parameters to URL
        if (params.length > 0) {
            const separator = url.includes('|') ? '&' : '|';
            url = url + separator + params.join('&');
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
