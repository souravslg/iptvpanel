import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Auto-sync endpoint - fetches source M3U and updates database cookies daily

// Parse M3U content to extract streams with headers
function parseM3U(m3uContent) {
    const lines = m3uContent.split('\n');
    const streams = [];
    let currentStream = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('#EXTINF:')) {
            // Extract channel name from EXTINF line
            const nameMatch = line.match(/,\s*(.+)$/);
            if (nameMatch) {
                currentStream.name = nameMatch[1].trim();
            }
        } else if (line.startsWith('#EXTHTTP:')) {
            // Extract cookie from EXTHTTP tag
            const cookieMatch = line.match(/#EXTHTTP:\{"cookie":"([^"]+)"\}/);
            if (cookieMatch) {
                if (!currentStream.headers) currentStream.headers = {};
                currentStream.headers.Cookie = cookieMatch[1];
            }
        } else if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
            // Extract user-agent
            const ua = line.replace('#EXTVLCOPT:http-user-agent=', '').trim();
            if (!currentStream.headers) currentStream.headers = {};
            currentStream.headers['User-Agent'] = ua;
        } else if (line.startsWith('http://') || line.startsWith('https://')) {
            // Stream URL found
            currentStream.url = line;

            // Save stream if it has headers
            if (currentStream.url && currentStream.headers) {
                streams.push({ ...currentStream });
            }

            // Reset for next stream
            currentStream = {};
        }
    }

    return streams;
}

export async function GET(request) {
    try {
        // Initialize Supabase client at runtime (not build time)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verify authorization (cron secret or admin)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting playlist sync...');

        // Fetch source M3U
        const sourceUrl = 'https://raw.githubusercontent.com/abid58b/JioTvPlaylist/refs/heads/main/jiotv.m3u';
        const response = await fetch(sourceUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch source M3U: ${response.status}`);
        }

        const m3uContent = await response.text();
        console.log('Source M3U fetched successfully');

        // Parse M3U to extract streams with cookies
        const sourceStreams = parseM3U(m3uContent);
        console.log(`Parsed ${sourceStreams.length} streams from source M3U`);

        // Update database
        let updated = 0;
        let notFound = 0;
        let errors = 0;

        for (const sourceStream of sourceStreams) {
            try {
                // Find matching stream in database by URL
                const { data: dbStream, error: fetchError } = await supabase
                    .from('streams')
                    .select('id, name, url, headers')
                    .eq('url', sourceStream.url)
                    .maybeSingle();

                if (fetchError) {
                    console.error(`Error fetching stream: ${fetchError.message}`);
                    errors++;
                    continue;
                }

                if (dbStream) {
                    // Update headers with new cookie
                    const { error: updateError } = await supabase
                        .from('streams')
                        .update({
                            headers: JSON.stringify(sourceStream.headers),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', dbStream.id);

                    if (updateError) {
                        console.error(`Error updating stream ${dbStream.id}: ${updateError.message}`);
                        errors++;
                    } else {
                        updated++;
                    }
                } else {
                    notFound++;
                }
            } catch (err) {
                console.error(`Error processing stream: ${err.message}`);
                errors++;
            }
        }

        const result = {
            success: true,
            sourceStreams: sourceStreams.length,
            updated,
            notFound,
            errors,
            timestamp: new Date().toISOString()
        };

        console.log('Sync complete:', result);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
