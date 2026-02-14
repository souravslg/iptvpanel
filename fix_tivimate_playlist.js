const fs = require('fs');

const inputFile = 'current_playlist.m3u';
const outputFile = 'tivimate.m3u';

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n');
    const fixedLines = [];

    let currentItem = {
        extinf: '',
        kodiprop: [],
        exthttp: null, // JSON object
        extvlc: [],
        url: ''
    };

    // Helper to parse cookie string
    const parseCookie = (cookieStr) => {
        if (!cookieStr) return null;
        const parts = cookieStr.split(';');
        for (const part of parts) {
            const [key, val] = part.trim().split('=');
            if (key === '__hdnea__') {
                return val; // Return the value of __hdnea__
            }
        }
        // Fallback: checks if the whole string is the token
        if (cookieStr.includes('__hdnea__=')) {
            return cookieStr.split('__hdnea__=')[1].split(';')[0];
        }
        return null;
    };

    // Helper to parse License Key URL to ID:Key
    const parseLicenseKey = (val) => {
        // Input: https://aqfadtv.xyz/clearkey/results.php?keyid=...&key=...
        // Output: keyid:key
        try {
            if (val.includes('keyid=') && val.includes('key=')) {
                // Simple extraction to avoid URL parsing issues with bad schemes
                const keyIdMatch = val.match(/keyid=([a-f0-9]+)/i);
                const keyMatch = val.match(/key=([a-f0-9]+)/i);
                if (keyIdMatch && keyMatch) {
                    return `${keyIdMatch[1]}:${keyMatch[1]}`;
                }
            }
            // If already id:key format
            if (val.match(/^[a-f0-9]{32}:[a-f0-9]{32}$/i)) {
                return val;
            }
        } catch (e) {
            console.log('Error parsing license key:', e);
        }
        // Manual parse fallback
        const keyIdMatch = val.match(/keyid=([a-f0-9]+)/i);
        const keyMatch = val.match(/key=([a-f0-9]+)/i);
        if (keyIdMatch && keyMatch) {
            return `${keyIdMatch[1]}:${keyMatch[1]}`;
        }
        return val; // Return original if parse fails
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTM3U')) {
            fixedLines.push(line);
            continue;
        }

        if (line.startsWith('#EXTINF')) {
            // Push previous item if exists and has URL
            if (currentItem.extinf && currentItem.url) {
                fixedLines.push(currentItem.extinf);
                [...new Set(currentItem.kodiprop)].forEach(k => fixedLines.push(`#KODIPROP:${k}`));
                // Removed EXTVLC and EXTHTTP output to match jtv.m3u format
                fixedLines.push(currentItem.url);
                fixedLines.push(''); // Spacer
            }

            // Start new item
            currentItem = {
                extinf: line,
                kodiprop: [],
                exthttp: null,
                extvlc: [],
                url: ''
            };
        } else if (line.startsWith('#KODIPROP:')) {
            const parts = line.substring(10).split('=');
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();

            if (key && val) {
                if (key === 'inputstream.adaptive.license_key') {
                    const cleanKey = parseLicenseKey(val);
                    currentItem.kodiprop.push(`inputstream.adaptive.license_key=${cleanKey}`);
                } else {
                    currentItem.kodiprop.push(`${key}=${val}`);
                }
            }
        } else if (line.startsWith('#EXTVLCOPT:')) {
            currentItem.extvlc.push(line);
        } else if (line.startsWith('#EXTHTTP:')) {
            try {
                const jsonStr = line.substring(9).trim();
                currentItem.exthttp = JSON.parse(jsonStr);
            } catch (e) {
                console.log('Error parsing EXTHTTP:', e);
            }
        } else if (!line.startsWith('#')) {
            // URL Line
            let url = line.split('|')[0].trim();

            // Logic: Append __hdnea__ from Cookie to URL
            if (currentItem.exthttp && (currentItem.exthttp.cookie || currentItem.exthttp.Cookie)) {
                const cookieVal = currentItem.exthttp.cookie || currentItem.exthttp.Cookie;
                const hdnea = parseCookie(cookieVal);
                if (hdnea) {
                    const separator = url.includes('?') ? '&' : '?';
                    if (!url.includes('__hdnea__=')) {
                        url = `${url}${separator}__hdnea__=${hdnea}`;
                    }
                }
            }
            currentItem.url = url;
        }
    }

    // Flush last item
    if (currentItem.extinf && currentItem.url) {
        fixedLines.push(currentItem.extinf);
        [...new Set(currentItem.kodiprop)].forEach(k => fixedLines.push(`#KODIPROP:${k}`));
        // Removed EXTVLC and EXTHTTP output to match jtv.m3u format
        fixedLines.push(currentItem.url);
    }

    fs.writeFileSync(outputFile, fixedLines.join('\n'));
    console.log(`✅ Fixed playlist saved to: ${outputFile}`);
    console.log(`📊 Lines: ${fixedLines.length}`);

} catch (err) {
    console.error('Error:', err);
}
