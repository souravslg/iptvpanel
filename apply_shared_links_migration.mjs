import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applySharedLinksMigration() {
    console.log('\n🚀 Running database migration: create_shared_links_table\n');

    try {
        // Read the SQL migration file
        const sqlContent = readFileSync(
            resolve(process.cwd(), 'migrations/create_shared_links_table.sql'),
            'utf-8'
        );

        console.log('📄 Migration SQL:');
        console.log('---');
        console.log(sqlContent);
        console.log('---\n');

        console.log('⚠️  Please run the above SQL in Supabase Dashboard → SQL Editor\n');
        console.log('After running the SQL, we can verify the table was created...\n');

        // Try to verify the table exists by querying it
        console.log('Attempting to verify table exists...');
        const { data, error } = await supabase
            .from('shared_links')
            .select('*')
            .limit(1);

        if (error) {
            if (error.code === '42P01') {
                console.log('❌ Table does not exist yet. Please run the SQL above in Supabase Dashboard.');
            } else {
                console.log('⚠️  Table check returned:', error.message);
            }
        } else {
            console.log('✅ Table "shared_links" exists and is accessible!');
            console.log('✅ Migration successful!\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

applySharedLinksMigration();
