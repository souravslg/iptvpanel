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

            // Extract attributes using regex
            const getAttr = (attr) => {
                const match = metaPart.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
                return match ? match[1] : '';
            };

            currentItem = {
                id: getAttr('tvg-id') || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: name || getAttr('tvg-name') || 'Unknown Channel',
                logo: getAttr('tvg-logo'),
                group: getAttr('group-title') || 'Uncategorized',
            };

        } else if (line.startsWith('http') || line.startsWith('rtmp') || (line.length > 0 && !line.startsWith('#'))) {
            // It's a URL
            if (currentItem.name) {
                currentItem.url = line;
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
