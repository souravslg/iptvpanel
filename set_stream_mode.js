require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setStreamMode() {
    console.log('Setting stream_mode to direct...');

    // Check if setting exists
    const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'stream_mode')
        .single();

    let error;

    if (existing) {
        const { error: updateError } = await supabase
            .from('settings')
            .update({ value: 'direct' })
            .eq('key', 'stream_mode');
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('settings')
            .insert({ key: 'stream_mode', value: 'direct' });
        error = insertError;
    }

    if (error) {
        console.error('Error updating stream_mode:', error);
    } else {
        console.log('SUCCESS: stream_mode set to "direct"');
    }
}

setStreamMode();
