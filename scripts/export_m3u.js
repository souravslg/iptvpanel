
import { supabase } from '../lib/supabase.js';
import fs from 'fs';

async function exportM3U() {
    console.log('Exporting streams to merged.m3u...');

    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .eq('enabled', true)
        .order('id', { ascending: true }); // Or order by channel number?

    if (error) {
        console.error('Error fetching streams:', error);
        return;
    }

    console.log(`Found ${streams.length} enabled streams.`);

    let content = '#EXTM3U\n';

    // Add Global Headers if needed? Not standard for M3U but good for debugging.

    streams.forEach(stream => {
        // Headers (EXTHTTP)
        if (stream.headers) {
            try {
                const headers = JSON.parse(stream.headers);
                content += `#EXTHTTP:${JSON.stringify(headers)}\n`;
                // Also add EXTVLCOPT for compatibility
                if (headers['User-Agent']) {
                    content += `#EXTVLCOPT:http-user-agent=${headers['User-Agent']}\n`;
                }
            } catch (e) {
                console.warn(`Invalid JSON headers for stream ${stream.name}:`, e);
            }
        }

        // DRM (KODIPROP)
        if (stream.drm_scheme) {
            content += `#KODIPROP:inputstream.adaptive.license_type=${stream.drm_scheme}\n`;
        }
        if (stream.drm_key_id && stream.drm_key) {
            content += `#KODIPROP:inputstream.adaptive.license_key=${stream.drm_key_id}:${stream.drm_key}\n`;
        } else if (stream.drm_license_url) {
            content += `#KODIPROP:inputstream.adaptive.license_key=${stream.drm_license_url}\n`;
        }

        // EXTINF
        let extinf = `#EXTINF:-1`;
        if (stream.stream_id) extinf += ` tvg-id="${stream.stream_id}"`;
        if (stream.name) extinf += ` tvg-name="${stream.name}"`;
        if (stream.logo) extinf += ` tvg-logo="${stream.logo}"`;
        if (stream.category) extinf += ` group-title="${stream.category}"`;
        if (stream.channel_number) extinf += ` tvg-chno="${stream.channel_number}"`;

        // Strip comma from name if present in attributes to avoid confusion? No, just append name.
        extinf += `,${stream.name}`;

        content += `${extinf}\n`;
        content += `${stream.url}\n\n`;
    });

    fs.writeFileSync('merged.m3u', content);
    console.log('Successfully exported to merged.m3u');
}

exportM3U();
