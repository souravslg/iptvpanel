
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure it's not cached aggressively

export async function GET() {
    try {
        console.log('Fetching JTV playlist...');

        // 1. Fetch ZTV JSON
        // Using a CORS proxy might be needed if this endpoint blocks server-side fetch, but usually workers.dev is open.
        // If it fails, we might need headers.
        const ztvRes = await fetch("https://ztv.pfy.workers.dev", { next: { revalidate: 300 } });

        let ztvContent = "";

        if (ztvRes.ok) {
            const json = await ztvRes.json();
            const list = Array.isArray(json)
                ? json
                : (json.channels || json.data || json.list || Object.values(json));

            for (const ch of list) {
                const name = ch.name || "Unknown";
                const logo = ch.logo || "";
                const url = ch.link || ch.url || ch.mpd || "";
                const lic = ch.drmLicense || "";
                const cookie = ch.cookie || "";

                if (!url) continue;

                ztvContent += `#EXTINF:-1 group-title="JTV" tvg-logo="${logo}",${name}\n`;

                if (lic && lic.includes(":")) {
                    ztvContent += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
                    ztvContent += `#KODIPROP:inputstream.adaptive.license_key=${lic}\n`;
                }

                if (cookie) {
                    ztvContent += `#EXTHTTP:{"cookie":"${cookie}"}\n`;
                }

                ztvContent += url + "\n";
            }
        } else {
            console.error("Failed to fetch ZTV:", ztvRes.status);
            ztvContent = "# JTV Fetch Failed\n";
        }

        // 2. Fetch Sony Playlist
        const sonyRes = await fetch("https://raw.githubusercontent.com/cloudplay97/m3u/refs/heads/main/sony.m3u", { next: { revalidate: 3600 } });
        let sonyContent = "";

        if (sonyRes.ok) {
            let text = await sonyRes.text();
            // Remove #EXTM3U header if present to allow clean merge
            text = text.replace(/^#EXTM3U\s*/i, '');
            sonyContent = "\n" + text;
        } else {
            console.error("Failed to fetch Sony:", sonyRes.status);
        }

        // 3. Combine
        const finalM3U = `#EXTM3U\n` + ztvContent + sonyContent;

        return new NextResponse(finalM3U, {
            headers: {
                'Content-Type': 'audio/x-mpegurl',
                'Content-Disposition': 'inline; filename="jtv.m3u"'
            }
        });

    } catch (error) {
        console.error("Error generating JTV playlist:", error);
        return NextResponse.json({ error: "Failed to generate playlist" }, { status: 500 });
    }
}
