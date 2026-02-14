// Test Xtream API output for DRM keys
import { supabase } from './lib/supabase.js';

async function testXtreamAPI() {
    // Get a sample DRM stream
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .not('drm_scheme', 'is', null)
        .limit(3);

    console.log('Sample DRM Streams:');
    streams?.forEach(s => {
        console.log('\n---');
        console.log('Stream:', s.name);
        console.log('DRM Scheme:', s.drm_scheme);
        console.log('DRM Key ID:', s.drm_key_id);
        console.log('DRM Key:', s.drm_key);
        console.log('DRM License URL:', s.drm_license_url);
        console.log('Stream Format:', s.stream_format);
        console.log('URL:', s.url);
    });

    // Check settings
    const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['stream_mode', 'invalid_subscription_video']);

    console.log('\n\nSettings:');
    settings?.forEach(s => console.log(`${s.key}: ${s.value}`));

    process.exit(0);
}

testXtreamAPI().catch(console.error);
