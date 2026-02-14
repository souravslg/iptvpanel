import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const linkId = '7e442b1782cfab77468ca2444ff9ce02';

console.log('\n🔍 Testing Database Query for link:', linkId, '\n');

async function testQuery() {
    try {
        console.log('Querying shared_links table...');
        const { data: link, error } = await supabase
            .from('shared_links')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) {
            console.log('❌ Database Error:', error);
            return;
        }

        if (!link) {
            console.log('❌ Link not found in database');
            return;
        }

        console.log('✅ Link found!');
        console.log('\nLink Details:');
        console.log('  ID:', link.id);
        console.log('  Name:', link.name);
        console.log('  Source URL:', link.source_url);
        console.log('  Status:', link.status);
        console.log('  Expire Date:', link.expire_date);
        console.log('  Max Uses:', link.max_uses);
        console.log('  Current Uses:', link.current_uses);

        console.log('\n✅ Database query successful!');
        console.log('Now testing M3U fetch from source...\n');

        const m3uResponse = await fetch(link.source_url);
        console.log('M3U Fetch Status:', m3uResponse.status);
        console.log('M3U Fetch OK:', m3uResponse.ok);

        if (m3uResponse.ok) {
            const content = await m3uResponse.text();
            console.log('M3U Content Length:', content.length, 'bytes');
            console.log('First line:', content.split('\n')[0]);
            console.log('\n✅ Everything looks good! The share link should work.');
        } else {
            console.log('❌ Failed to fetch M3U from source URL');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

testQuery();
