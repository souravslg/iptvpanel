// Check what stream_mode is set in database

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStreamMode() {
    console.log('=== Checking Stream Mode Setting ===\n');

    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'stream_mode')
        .single();

    if (error) {
        console.log('❌ Error:', error.message);
        console.log('\nSetting not found. Default is probably "proxy"');
    } else {
        console.log('Current stream_mode:', data.value);
        console.log('');

        if (data.value === 'redirect') {
            console.log('⚠️  Mode is "redirect"!');
            console.log('This causes 302 redirects with pipe headers.');
            console.log('TiviMate may not handle this correctly.');
            console.log('\n💡 Solution: Change to "proxy" mode');
        } else if (data.value === 'direct') {
            console.log('Mode is "direct" - streams go directly to source');
        } else if (data.value === 'proxy') {
            console.log('✅ Mode is "proxy" - streams are proxied through server');
        }
    }
}

checkStreamMode().catch(console.error);
