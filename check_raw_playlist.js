const fs = require('fs');

const inputFile = 'current_playlist.m3u';
console.log(`Reading ${inputFile}...`);

try {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n');

    let foundNE = false;
    let foundStar = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('NE News')) {
            console.log('\n--- NE News Context ---');
            // Print surrounding lines
            for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 15); j++) {
                console.log(`${j + 1}: ${lines[j].trim()}`);
            }
            foundNE = true;
        }
    }

    if (!foundNE) console.log('NE News NOT found in playlist.');

} catch (e) {
    console.error('Error:', e.message);
}
