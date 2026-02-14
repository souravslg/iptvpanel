import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupSharedLinksTable() {
    console.log('\n🚀 Setting up shared_links table...\n');

    try {
        // Try to query the table to see if it already exists
        console.log('Checking if shared_links table exists...');
        const { data: existingData, error: checkError } = await supabase
            .from('shared_links')
            .select('id')
            .limit(1);

        if (!checkError) {
            console.log('✅ Table already exists!');
            console.log('\nYou can now:');
            console.log('1. Navigate to http://localhost:3000/shared-links');
            console.log('2. Create your first shared link');
            console.log('3. Test it by accessing the share URL\n');
            return;
        }

        if (checkError.code === '42P01') {
            console.log('❌ Table does not exist yet.\n');
            console.log('📋 Please run the following SQL in Supabase Dashboard → SQL Editor:\n');
            console.log('---');
            console.log(`
CREATE TABLE IF NOT EXISTS shared_links (
    id SERIAL PRIMARY KEY,
    link_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    expire_date TIMESTAMP,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_by INTEGER REFERENCES admin(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shared_links_link_id ON shared_links(link_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_status ON shared_links(status);
            `.trim());
            console.log('\n---\n');
            console.log('After running the SQL above:');
            console.log('1. Run this script again to verify');
            console.log('2. Visit http://localhost:3000/shared-links\n');
        } else {
            console.log('⚠️  Unexpected error:', checkError.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

setupSharedLinksTable();
