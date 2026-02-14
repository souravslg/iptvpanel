import { supabase } from './lib/supabase.js';

async function checkJtvHeaders() {
    console.log('Checking JTV headers...');

    const { data: streams, error } = await supabase
        .from('streams')
        .select('name, url, headers')
        .ilike('url', '%jiotv%')
        .not('headers', 'is', null)
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    streams.forEach(s => {
        console.log(`\nName: ${s.name}`);
        console.log(`URL: ${s.url}`);
        let h = s.headers;
        if (typeof h === 'string') h = JSON.parse(h);
        console.log('Headers:', h);

        // Check if we can extract __hdnea__
        if (h && (h.cookie || h.Cookie)) {
            const cookieStr = h.cookie || h.Cookie;
            const match = cookieStr.match(/__hdnea__=([^;]+)/);
            if (match) {
                console.log('Found __hdnea__ token:', match[1].substring(0, 30) + '...');
            } else {
                console.log('__hdnea__ NOT found in cookie');
            }
        }
    });
}

checkJtvHeaders();
