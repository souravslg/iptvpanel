// Set stream_mode to 'direct' in database

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setDirectMode() {
    console.log('=== Setting Stream Mode to Direct ===\n');

    const { data, error } = await supabase
        .from('settings')
        .upsert({
            key: 'stream_mode',
            value: 'direct'
        }, {
            onConflict: 'key'
        })
        .select();

    if (error) {
        console.log('❌ Error:', error.message);
    } else {
        console.log('✅ Stream mode set to: direct');
        console.log('');
        console.log('This means:');
        console.log('- Xtream API will return direct URLs with pipe headers');
        console.log('- M3U export will use direct URLs with pipe headers');
        console.log('- Format: url|Cookie=value&User-Agent=value');
    }
}

setDirectMode().catch(console.error);
