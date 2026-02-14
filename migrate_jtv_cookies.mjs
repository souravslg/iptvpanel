import { supabase } from './lib/supabase.js';

async function migrateJtvCookies() {
    console.log('Starting migration of JTV cookies to URL query parameters...');

    // Fetch all JTV streams with headers
    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .ilike('url', '%jiotv%') // Target JTV streams
        .not('headers', 'is', null);

    if (error) {
        console.error('Error fetching streams:', error);
        return;
    }

    console.log(`Found ${streams.length} JTV streams to check.`);

    let updatedCount = 0;

    for (const stream of streams) {
        let headers = stream.headers;
        if (typeof headers === 'string') headers = JSON.parse(headers);

        let cookie = headers.cookie || headers.Cookie;

        if (cookie && cookie.includes('__hdnea__')) {
            // Extract token: __hdnea__=value...
            // It might be the whole cookie or part of it
            let token = '';

            // Check if cookie IS the token or contains it
            if (cookie.trim().startsWith('__hdnea__=')) {
                // Take the whole thing or split by ; if multiple cookies
                const parts = cookie.split(';');
                const tokenPart = parts.find(p => p.trim().startsWith('__hdnea__='));
                if (tokenPart) token = tokenPart.trim();
            } else {
                // Try regex if embedded
                const match = cookie.match(/(__hdnea__=[^;]+)/);
                if (match) token = match[1];
            }

            if (token) {
                // Params: url already has query?
                let newUrl = stream.url;
                if (newUrl.includes('?')) {
                    // Check if token already exists to avoid duplication
                    if (!newUrl.includes('__hdnea__=')) {
                        newUrl += `&${token}`;
                    }
                } else {
                    newUrl += `?${token}`;
                }

                // Remove cookie from headers
                const newHeaders = { ...headers };
                delete newHeaders.cookie;
                delete newHeaders.Cookie;

                // If headers empty, set to null
                const headersToSave = Object.keys(newHeaders).length > 0 ? newHeaders : null;

                // Update DB
                const { error: updateError } = await supabase
                    .from('streams')
                    .update({
                        url: newUrl,
                        headers: headersToSave
                    })
                    .eq('id', stream.id);

                if (updateError) {
                    console.error(`Failed to update ${stream.name}:`, updateError);
                } else {
                    updatedCount++;
                    // console.log(`Migrated: ${stream.name}`);
                }
            }
        }
    }

    console.log(`\nMigration complete. Updated ${updatedCount} streams.`);
}

migrateJtvCookies();
