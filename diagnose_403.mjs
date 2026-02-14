import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const linkId = '7e442b1782cfab77468ca2444ff9ce02';

console.log('\n🔍 Diagnosing 403 Forbidden Error\n');

async function diagnose() {
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

        console.log('Link Details:');
        console.log('  Status:', link.status);
        console.log('  Expire Date:', link.expire_date);
        console.log('  Max Uses:', link.max_uses);
        console.log('  Current Uses:', link.current_uses);
        console.log('');

        // Check status
        if (link.status !== 'Active') {
            console.log('❌ PROBLEM: Status is not "Active"');
            console.log('   Fixing status...');

            await supabase
                .from('shared_links')
                .update({ status: 'Active' })
                .eq('id', link.id);

            console.log('✅ Status set to Active');
        } else {
            console.log('✅ Status is Active');
        }

        // Check expiry
        if (link.expire_date) {
            const expiryDate = new Date(link.expire_date);
            const now = new Date();
            console.log(`   Expiry: ${expiryDate.toISOString()}`);
            console.log(`   Now:    ${now.toISOString()}`);

            if (now > expiryDate) {
                console.log('❌ PROBLEM: Link has expired');
            } else {
                console.log('✅ Link has not expired');
            }
        } else {
            console.log('✅ No expiry date');
        }

        // Check max uses
        if (link.max_uses !== null) {
            console.log(`   Uses: ${link.current_uses} / ${link.max_uses}`);

            if (link.current_uses >= link.max_uses) {
                console.log('❌ PROBLEM: Max uses exceeded');
                console.log('   Resetting current_uses to 0...');

                await supabase
                    .from('shared_links')
                    .update({ current_uses: 0 })
                    .eq('id', link.id);

                console.log('✅ Uses reset');
            } else {
                console.log('✅ Uses OK');
            }
        } else {
            console.log('✅ Unlimited uses');
        }

        console.log('\n✅ All checks passed! Try accessing the link again.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

diagnose();
