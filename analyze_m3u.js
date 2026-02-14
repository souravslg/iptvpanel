async function analyzeM3U() {
    const url = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u';
    console.log(`Fetching ${url}...`);
    const r = await fetch(url);
    const text = await r.text();
    const lines = text.split('\n');

    console.log(`Total lines: ${lines.length}`);

    // Check for KODIPROP
    const kodiProps = lines.filter(l => l.startsWith('#KODIPROP'));
    console.log(`Found ${kodiProps.length} #KODIPROP lines`);
    if (kodiProps.length > 0) {
        console.log('Sample KODIPROP:', kodiProps[0]);
    }

    // Check for Pipe headers
    const pipeUrls = lines.filter(l => !l.startsWith('#') && l.includes('|'));
    console.log(`Found ${pipeUrls.length} URLs with pipe headers`);
    if (pipeUrls.length > 0) {
        console.log('Sample Pipe URL:', pipeUrls[0].substring(0, 100) + '...');
    }

    // Check schema for headers column
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('https://utfblxhfyoebonlgtbwz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk');

    const { error } = await supabase.from('streams').select('headers').limit(1);
    console.log('Headers column exists:', !error);
}

analyzeM3U().catch(console.error);
