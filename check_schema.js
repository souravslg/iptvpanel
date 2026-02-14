const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('=== Checking Streams Table Schema ===\n');

    // Try to get ANY stream from ANY playlist
    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .limit(1);

    if (error) {
        console.log('❌ Error selecting:', error.message);
        return;
    }

    if (streams && streams.length > 0) {
        console.log('Found an existing stream. Keys:');
        console.log(Object.keys(streams[0]).join(', '));
    } else {
        console.log('⚠️ No streams found in entire table. Cannot infer schema from data.');

        // Try inserting a minimal row to see what works
        console.log('\nAttempting minimal insert (dry run)...');
        // We won't actually insert, just wanted to check keys. 
        // But since we can't see keys, let's try to query columns?
        // Supabase-js doesn't expose schema directly easily.
    }
}

checkSchema().catch(console.error);
