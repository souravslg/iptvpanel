// Debug script to check if cookies are properly stored and URLs are being generated correctly

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCookieStreams() {
    console.log('=== Debugging Cookie-Based Streams ===\n');

    // 1. Check if any streams have cookies
    const { data: cookieStreams, error } = await supabase
        .from('streams')
        .select('stream_id, name, url, headers, stream_format')
        .not('headers', 'is', null)
        .limit(5);

    if (error) {
        console.error('Error fetching streams:', error);
        return;
    }

    console.log(`Found ${cookieStreams?.length || 0} streams with headers\n`);

    for (const stream of cookieStreams || []) {
        console.log(`\n--- Stream: ${stream.name} ---`);
        console.log(`Stream ID: ${stream.stream_id}`);
        console.log(`Format: ${stream.stream_format}`);
        console.log(`URL: ${stream.url?.substring(0, 100)}...`);

        try {
            const headers = typeof stream.headers === 'string'
                ? JSON.parse(stream.headers)
                : stream.headers;

            console.log('\nHeaders:');
            console.log(JSON.stringify(headers, null, 2));

            // Check for cookie
            const hasCookie = headers.Cookie || headers.cookie;
            console.log(`\n✓ Has Cookie: ${hasCookie ? 'YES' : 'NO'}`);

            if (hasCookie) {
                const cookieStr = headers.Cookie || headers.cookie;
                console.log(`Cookie preview: ${cookieStr.substring(0, 50)}...`);
            }
        } catch (e) {
            console.error('Error parsing headers:', e.message);
        }
    }

    // 2. Check Star Sports 1 HD specifically
    console.log('\n\n=== Checking Star Sports 1 HD ===');
    const { data: starSports } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%star%sports%1%hd%')
        .limit(1)
        .single();

    if (starSports) {
        console.log(`\nName: ${starSports.name}`);
        console.log(`Stream ID: ${starSports.stream_id}`);
        console.log(`URL: ${starSports.url}`);
        console.log(`Has headers: ${starSports.headers ? 'YES' : 'NO'}`);

        if (starSports.headers) {
            const h = typeof starSports.headers === 'string'
                ? JSON.parse(starSports.headers)
                : starSports.headers;
            console.log(`Has Cookie: ${h.Cookie || h.cookie ? 'YES' : 'NO'}`);
        }
    }

    // 3. Check a failing channel
    console.log('\n\n=== Checking NE News (typical failing channel) ===');
    const { data: neNews } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%NE%News%')
        .limit(1)
        .single();

    if (neNews) {
        console.log(`\nName: ${neNews.name}`);
        console.log(`Stream ID: ${neNews.stream_id}`);
        console.log(`URL: ${neNews.url}`);
        console.log(`Has headers: ${neNews.headers ? 'YES' : 'NO'}`);

        if (neNews.headers) {
            const h = typeof neNews.headers === 'string'
                ? JSON.parse(neNews.headers)
                : neNews.headers;
            console.log(`Has Cookie: ${h.Cookie || h.cookie ? 'YES' : 'NO'}`);
        }
    } else {
        console.log('NE News not found, trying Colors HD instead...');
        const { data: colors } = await supabase
            .from('streams')
            .select('*')
            .ilike('name', '%colors%hd%')
            .limit(1)
            .single();

        if (colors) {
            console.log(`\nName: ${colors.name}`);
            console.log(`Stream ID: ${colors.stream_id}`);
            console.log(`URL: ${colors.url}`);
            console.log(`Has headers: ${colors.headers ? 'YES' : 'NO'}`);

            if (colors.headers) {
                const h = typeof colors.headers === 'string'
                    ? JSON.parse(colors.headers)
                    : colors.headers;
                console.log(`Has Cookie: ${h.Cookie || h.cookie ? 'YES' : 'NO'}`);
            }
        }
    }

    // 4. Check stream_mode setting
    console.log('\n\n=== Checking stream_mode setting ===');
    const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();

    console.log(`Stream mode: ${setting?.value || 'not set (defaults to proxy)'}`);
}

debugCookieStreams().then(() => {
    console.log('\n\n=== Debug Complete ===');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
