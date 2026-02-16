const fs = require('fs');

async function runCheck() {
    console.log('--- Verifying tivimate.m3u Content ---');
    try {
        const data = fs.readFileSync('tivimate.m3u', 'utf8');
        const lines = data.split('\n');

        let foundStar = false;
        let foundNE = false;
        let output = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Search for Star Sports Select 1 HD
            if (line.includes('Star Sports Select 1 HD')) {
                output += '\n[Star Sports Found]\n';
                output += `${lines[i]}\n`; // INF
                // Next lines (approx 3)
                if (lines[i + 1]) output += `${lines[i + 1]}\n`;
                if (lines[i + 2]) output += `${lines[i + 2]}\n`;
                if (lines[i + 3]) output += `${lines[i + 3]}\n`;
                if (lines[i + 4]) output += `${lines[i + 4]}\n`;
                foundStar = true;
            }

            // Search for NE News
            if (line.includes('NE News')) {
                output += '\n[NE News Found]\n';
                output += `${lines[i]}\n`; // INF
                if (lines[i + 1]) output += `${lines[i + 1]}\n`;
                if (lines[i + 2]) output += `${lines[i + 2]}\n`;
                if (lines[i + 3]) output += `${lines[i + 3]}\n`;
                if (lines[i + 4]) output += `${lines[i + 4]}\n`;
                foundNE = true;
            }

            // Search for random others
            if (line.includes('Zee Cafe HD')) {
                output += '\n[Zee Cafe HD Found]\n';
                output += `${lines[i]}\n`; // INF
                if (lines[i + 1]) output += `${lines[i + 1]}\n`;
                if (lines[i + 2]) output += `${lines[i + 2]}\n`;
                if (lines[i + 3]) output += `${lines[i + 3]}\n`;
                if (lines[i + 4]) output += `${lines[i + 4]}\n`;
            }
        }

        console.log(output);
        if (!foundStar) console.log('Star Sports NOT found.');
        if (!foundNE) console.log('NE News NOT found.');

    } catch (e) {
        console.error('Error:', e.message);
    }
}

runCheck();
