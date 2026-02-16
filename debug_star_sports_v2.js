const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log('--- Debugging Channel Formats ---');

    // 1. Fetch Star Sports HD
    const { data: starSports } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Star%Sports%HD%')
        .limit(1);

    if (starSports?.[0]) {
        console.log('\n[Working Channel] Star Sports HD:');
        console.log('Name:', starSports[0].name);
        console.log('URL:', starSports[0].url);
        console.log('Format:', starSports[0].stream_format);
        console.log('Headers:', starSports[0].headers);
        console.log('DRM:', starSports[0].drm_scheme);
    } else {
        console.log('\nStar Sports HD not found.');
    }

    // 2. Fetch a specific non-working channel (e.g. Astro Cricket, or just another one)
    const { data: otherChannel } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Astro%')
        .limit(1);

    if (otherChannel?.[0]) {
        console.log('\n[Likely Non-Working] Other Channel:');
        console.log('Name:', otherChannel[0].name);
        console.log('URL:', otherChannel[0].url);
        console.log('Format:', otherChannel[0].stream_format);
        console.log('Headers:', otherChannel[0].headers);
        console.log('DRM:', otherChannel[0].drm_scheme);
    } else {
        // Fallback to any other channel
        const { data: anyChannel } = await supabase
            .from('streams')
            .select('*')
            .not('name', 'ilike', '%Star%Sports%HD%')
            .limit(1);

        if (anyChannel?.[0]) {
            console.log('\n[Comparison] Random Channel:');
            console.log('Name:', anyChannel[0].name);
            console.log('URL:', anyChannel[0].url);
            console.log('Format:', anyChannel[0].stream_format);
            console.log('Headers:', anyChannel[0].headers);
            console.log('DRM:', anyChannel[0].drm_scheme);
        }
    }
}

runDebug();
