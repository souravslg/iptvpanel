const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    let output = '--- Debugging Channel Formats ---\n\n';

    // 1. Fetch Star Sports HD
    const { data: starSports } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Star%Sports%HD%')
        .limit(1);

    if (starSports?.[0]) {
        output += `[Working Channel] Star Sports HD:\n`;
        output += `Name: ${starSports[0].name}\n`;
        output += `URL: ${starSports[0].url}\n`;
        output += `Format: ${starSports[0].stream_format}\n`;
        output += `Headers: ${JSON.stringify(starSports[0].headers, null, 2)}\n`;
        output += `DRM: ${starSports[0].drm_scheme}\n\n`;
    } else {
        output += `Star Sports HD not found.\n\n`;
    }

    // 2. Fetch another JioTV channel (likely non-working if user says "others not working")
    const { data: otherChannel } = await supabase
        .from('streams')
        .select('*')
        .ilike('url', '%jiotvmblive%')
        .not('name', 'ilike', '%Star%Sports%HD%')
        .limit(1);

    if (otherChannel?.[0]) {
        output += `[Comparison] Other Jio Channel:\n`;
        output += `Name: ${otherChannel[0].name}\n`;
        output += `URL: ${otherChannel[0].url}\n`;
        output += `Format: ${otherChannel[0].stream_format}\n`;
        output += `Headers: ${JSON.stringify(otherChannel[0].headers, null, 2)}\n`;
        output += `DRM: ${otherChannel[0].drm_scheme}\n\n`;
    } else {
        // Fallback
        const { data: anyChannel } = await supabase
            .from('streams')
            .select('*')
            .not('name', 'ilike', '%Star%Sports%HD%')
            .limit(1);

        if (anyChannel?.[0]) {
            output += `[Comparison] Random Channel:\n`;
            output += `Name: ${anyChannel[0].name}\n`;
            output += `URL: ${anyChannel[0].url}\n`;
            output += `Format: ${anyChannel[0].stream_format}\n`;
            output += `Headers: ${JSON.stringify(anyChannel[0].headers, null, 2)}\n`;
            output += `DRM: ${anyChannel[0].drm_scheme}\n\n`;
        }
    }

    fs.writeFileSync('debug_output.txt', output);
    console.log('Debug output written to debug_output.txt');
}

runDebug();
