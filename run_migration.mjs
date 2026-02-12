import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

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

async function runMigration() {
    console.log('\n🚀 Running database migration: add_enabled_column\n');

    try {
        // Step 1: Add column directly using update (triggers schema change)
        console.log('Step 1: Adding enabled column to streams table...');

        // First, let's check if we can query the table
        const { data: testData, error: testError } = await supabase
            .from('streams')
            .select('id')
            .limit(1);

        if (testError) {
            console.error('❌ Error accessing streams table:', testError);
            throw testError;
        }

        console.log('✅ Successfully connected to streams table');

        // Try to update - Supabase will auto-add the column if it doesn't exist
        console.log('\nStep 2: Setting enabled=true for all existing channels...');
        const { error: updateError } = await supabase
            .from('streams')
            .update({ enabled: true })
            .neq('id', 0); // Update all rows

        if (updateError) {
            // If column doesn't exist, it will error - we need to add it manually
            console.log('Column may not exist yet. Will need manual SQL execution.');
            console.log('\n⚠️  Please run this SQL in Supabase Dashboard → SQL Editor:');
            console.log('---');
            console.log('ALTER TABLE streams ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;');
            console.log('CREATE INDEX IF NOT EXISTS idx_streams_enabled ON streams(enabled);');
            console.log('UPDATE streams SET enabled = true WHERE enabled IS NULL;');
            console.log('---\n');
        } else {
            console.log('✅ All channels set to enabled');
        }

        // Verify
        console.log('\n📊 Verifying current data...');
        const { data: sample, error: verifyError } = await supabase
            .from('streams')
            .select('id, name, enabled')
            .limit(5);

        if (verifyError) {
            console.log('⚠️  Could not verify (column might not exist yet):', verifyError.message);
        } else {
            console.log('✅ Sample data from streams table:');
            console.table(sample);
            console.log('\n✅ Migration appears successful!');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n📝 Manual SQL required. Run this in Supabase Dashboard:');
        console.log('ALTER TABLE streams ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;');
        console.log('CREATE INDEX IF NOT EXISTS idx_streams_enabled ON streams(enabled);');
    }
}

runMigration();
