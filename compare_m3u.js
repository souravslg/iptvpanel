// Compare our M3U output with source M3U format

async function compareFormats() {
    console.log('=== Comparing M3U Formats ===\n');

    // Get our M3U
    const ourResponse = await fetch('http://localhost:3000/api/get?username=shiv&password=shiv1');
    const ourM3u = await ourResponse.text();

    // Get source M3U
    const sourceResponse = await fetch('https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u');
    const sourceM3u = await sourceResponse.text();

    // Find Colors HD in both
    const ourLines = ourM3u.split('\n');
    const sourceLines = sourceM3u.split('\n');

    const ourColorsIndex = ourLines.findIndex(l => l.includes('Colors HD'));
    const sourceColorsIndex = sourceLines.findIndex(l => l.includes('ColorsHD'));

    console.log('OUR M3U (Colors HD):');
    console.log('---');
    if (ourColorsIndex > -1) {
        // Show 5 lines before Colors HD
        for (let i = Math.max(0, ourColorsIndex - 5); i <= ourColorsIndex + 1; i++) {
            if (ourLines[i]) {
                console.log(ourLines[i]);
            }
        }
    }
    console.log('---\n');

    console.log('SOURCE M3U (Colors HD):');
    console.log('---');
    if (sourceColorsIndex > -1) {
        // Show 5 lines before Colors HD
        for (let i = Math.max(0, sourceColorsIndex - 5); i <= sourceColorsIndex + 1; i++) {
            if (sourceLines[i]) {
                console.log(sourceLines[i]);
            }
        }
    }
    console.log('---\n');

    // Check if URLs match
    const ourUrl = ourLines[ourColorsIndex + 1];
    const sourceUrl = sourceLines[sourceColorsIndex + 1];

    console.log('URL Comparison:');
    console.log('Our URL includes jiotv:', ourUrl?.includes('jiotv'));
    console.log('Source URL includes jiotv:', sourceUrl?.includes('jiotv'));
    console.log('Our URL has pipe:', ourUrl?.includes('|'));
    console.log('Source URL has pipe:', sourceUrl?.includes('|'));
}

compareFormats().catch(console.error);
