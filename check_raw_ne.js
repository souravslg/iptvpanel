const fs = require('fs');

const inputFile = 'current_playlist.m3u';
const outputFile = 'debug_ne_raw.txt';

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n');

    let output = '';
    let found = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('NE News')) {
            output += `Found 'NE News' at line ${i + 1}:\n`;
            // Capture context
            for (let j = Math.max(0, i); j < Math.min(lines.length, i + 10); j++) {
                output += `${j + 1}: ${lines[j].trim()}\n`;
            }
            output += '\n';
            found = true;
        }
    }

    if (!found) output = 'NE News NOT found in playlist.\n';

    fs.writeFileSync(outputFile, output);
    console.log(`Debug output written to ${outputFile}`);

} catch (e) {
    console.error('Error:', e.message);
}
