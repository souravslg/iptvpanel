const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log('Comparing Star Sports HD with other channels...');

    // Fetch Star Sports HD
    const { data: starSports, error: starError } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Star Sports 1 HD%') // Assuming specific name, maybe adjust query
        .limit(1);

    if (starError) {
        console.error('Error fetching Star Sports:', starError);
        return;
    }

    if (!starSports || starSports.length === 0) {
        console.log('Star Sports HD not found.');
        // Try broader search
        const { data: starSportsBroad } = await supabase
            .from('streams')
            .select('*')
            .ilike('name', '%Star Sports%')
            .limit(5);
        console.log('Possible Star Sports matches:', starSportsBroad?.map(s => s.name));
    } else {
        console.log('Star Sports HD Details:', starSports[0]);
    }

    // Fetch a likely non-working channel (e.g., another Sports channel or generic one)
    const { data: otherChannel, error: otherError } = await supabase
        .from('streams')
        .select('*')
        .neq('name', starSports?.[0]?.name || 'Star Sports 1 HD')
        .limit(1);

    if (otherChannel && otherChannel.length > 0) {
        console.log('Comparison Channel Details:', otherChannel[0]);
    }

    // Check Stream Mode
    const { data: modeData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'stream_mode')
        .single();
    console.log('Stream Mode Setting:', modeData?.value);
}

runDebug();
