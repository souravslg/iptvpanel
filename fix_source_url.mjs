import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const linkId = '7e442b1782cfab77468ca2444ff9ce02';

console.log('\n🔍 Checking Source URL in Database\n');

async function checkAndFixUrl() {
    try {
        const { data: link, error } = await supabase
            .from('shared_links')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error || !link) {
            console.log('❌ Link not found');
            return;
        }

        console.log('Current source_url:', JSON.stringify(link.source_url));
        console.log('Length:', link.source_url.length);
        console.log('');

        // Check if URL is malformed
        if (!link.source_url.startsWith('http://') && !link.source_url.startsWith('https://')) {
            console.log('❌ URL is malformed! Fixing...\n');

            const correctUrl = 'https://raw.githubusercontent.com/souravslg/iptvpanel/refs/heads/main/merged3.m3u';

            const { error: updateError } = await supabase
                .from('shared_links')
                .update({ source_url: correctUrl })
                .eq('id', link.id);

            if (updateError) {
                console.log('❌ Failed to update:', updateError);
            } else {
                console.log('✅ URL fixed to:', correctUrl);
                console.log('\nTry accessing the share link again!');
            }
        } else {
            console.log('✅ URL looks correct:\n  ', link.source_url);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkAndFixUrl();
