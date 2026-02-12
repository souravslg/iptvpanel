import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SQL_STATEMENTS = [
    'ALTER TABLE streams ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true',
    'CREATE INDEX IF NOT EXISTS idx_streams_enabled ON streams(enabled)',
    'UPDATE streams SET enabled = true WHERE enabled IS NULL'
];

async function executeSql(sql) {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ query: sql })
    });

    return response.json();
}

async function runMigration() {
    console.log('🚀 Running migration...\n');

    // Try using Supabase REST API to execute SQL
    console.log('Attempting to execute SQL via Supabase API...');
    console.log('This might not work if the function is not enabled.\n');

    for (const sql of SQL_STATEMENTS) {
        console.log(`Executing: ${sql}`);
        try {
            const result = await executeSql(sql);
            console.log('Result:', result);
        } catch (err) {
            console.log('Error:', err.message);
        }
    }

    console.log('\n⚠️  If the above failed, please run this SQL manually in Supabase Dashboard → SQL Editor:');
    console.log('\n--- COPY THIS SQL ---');
    SQL_STATEMENTS.forEach(sql => console.log(sql + ';'));
    console.log('--- END SQL ---\n');
}

runMigration().catch(console.error);
