import { supabase } from './lib/supabase.js';

async function cleanJtvHeaders() {
    console.log('Fetching JTV streams to clean headers...');

    // Fetch all JTV streams (identified by jiotv CDN url)
    const { data: streams, error } = await supabase
        .from('streams')
        .select('id, name, headers')
        .ilike('url', '%jiotvbpkmob%'); // JTV CDN domain

    if (error) {
        console.error('Error fetching streams:', error);
        return;
    }

    console.log(`Found ${streams.length} JTV streams.`);

    let updatedCount = 0;

    for (const stream of streams) {
        if (!stream.headers) continue;

        // Parse headers
        let headers = typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers;

        // Check if it has extra headers (User-Agent, Referer)
        const hasExtra = Object.keys(headers).some(k => k.toLowerCase() !== 'cookie');

        if (hasExtra) {
            // Keep ONLY cookie
            const newHeaders = {};
            if (headers.cookie) newHeaders.cookie = headers.cookie;
            else if (headers.Cookie) newHeaders.cookie = headers.Cookie;

            // Update stream
            const { error: updateError } = await supabase
                .from('streams')
                .update({ headers: newHeaders })
                .eq('id', stream.id);

            if (updateError) {
                console.error(`Failed to update ${stream.name} (${stream.id}):`, updateError);
            } else {
                console.log(`Cleaned headers for: ${stream.name} (${stream.id})`);
                updatedCount++;
            }
        }
    }

    console.log(`\nFixed ${updatedCount} streams.`);
}

cleanJtvHeaders();
