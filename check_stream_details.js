const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';
const supabase = createClient(supabaseUrl, supabaseKey);


async function findWorkingStream() {
    console.log('Scanning for working streams...');
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .limit(50); // increased limit

    if (streams && streams.length > 0) {
        for (const stream of streams) {
            const rawUrl = stream.url || '';
            const cleanedUrl = rawUrl.replace(/\s/g, '').trim();

            if (!cleanedUrl.startsWith('http')) continue;

            try {
                // Short timeout to speed up scanning
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const res = await fetch(cleanedUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.status === 200) {
                    console.log('---------------------------------------------------');
                    console.log('FOUND WORKING STREAM!');
                    console.log('ID:', stream.id, 'StreamID:', stream.stream_id);
                    console.log('Name:', stream.name);
                    console.log('URL:', cleanedUrl);
                    return; // Stop after finding one
                }
                process.stdout.write('.'); // progress indicator
            } catch (e) {
                // ignore errors
            }
        }
        console.log('\nNo working streams found in first 50.');
    } else {
        console.log('No streams found in DB');
    }
}

findWorkingStream();
