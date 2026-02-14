import { supabase } from './lib/supabase.js';

async function setDirectMode() {
    console.log('Setting stream_mode to direct...');

    // Check current setting
    const { data: current } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'stream_mode')
        .single();

    console.log('Current stream_mode:', current);

    if (current) {
        // Update existing
        const { data, error } = await supabase
            .from('settings')
            .update({ value: 'direct' })
            .eq('key', 'stream_mode')
            .select();

        console.log('Updated:', data, error);
    } else {
        // Insert new
        const { data, error } = await supabase
            .from('settings')
            .insert({ key: 'stream_mode', value: 'direct' })
            .select();

        console.log('Inserted:', data, error);
    }

    // Verify
    const { data: verify } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'stream_mode')
        .single();

    console.log('✅ Stream mode now:', verify);
    process.exit(0);
}

setDirectMode().catch(console.error);
