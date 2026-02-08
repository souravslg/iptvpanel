export class Zee5 {
    static async fetchChannels() {
        const playlistUrl = 'http://hcw08a7zgsj.sn.mynetname.net:3001/zee5/playlist.php';

        try {
            const res = await fetch(playlistUrl);
            const text = await res.text();

            if (!text) return [];

            const lines = text.split('\n');
            const channels = [];
            let currentUserAgent = '';

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                if (line.includes('http-user-agent=')) {
                    currentUserAgent = line.split('=')[1].trim();
                } else if (line.startsWith('http')) {
                    // Extract channel ID from URL
                    // Example: http://hcw08a7zgsj.sn.mynetname.net:3001/zee5/index.php?id=0-9-zeetamil&%7CUser-Agent=...
                    const urlObj = new URL(line.replace('%7C', '|'));
                    const id = urlObj.searchParams.get('id') || 'unknown';

                    // Clean name from ID (e.g. 0-9-zeetamil -> Zee Tamil)
                    let name = id.split('-').pop() || id;

                    // Format name
                    const formattedName = name
                        .replace(/^zee/, 'Zee ')
                        .replace(/hd$/, ' HD')
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .trim();

                    // Clean the URL by removing the pipe headers (they are handled by the headers column)
                    let cleanUrl = line;
                    let pipeIndex = line.indexOf('|');
                    if (pipeIndex === -1) pipeIndex = line.indexOf('%7C');
                    if (pipeIndex !== -1) cleanUrl = line.substring(0, pipeIndex);

                    channels.push({
                        id: id,
                        name: formattedName.toUpperCase(),
                        url: cleanUrl,
                        userAgent: currentUserAgent,
                        stream_id: `zee5-${id}`
                    });
                }
            }

            return channels;
        } catch (e) {
            console.error('Zee5 Fetch Error:', e);
            return [];
        }
    }

    static async generateM3U() {
        const channels = await this.fetchChannels();
        let m3u = '#EXTM3U\n';

        for (const ch of channels) {
            m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="" group-title="Zee5",${ch.name}\n`;
            if (ch.userAgent) {
                m3u += `#EXTVLCOPT:http-user-agent=${ch.userAgent}\n`;
            }
            m3u += `${ch.url}\n\n`;
        }

        return m3u;
    }
}
