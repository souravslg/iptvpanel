import { supabase } from './lib/supabase.js';

async function verifyMigration() {
    console.log('Verifying migration...');

    const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .ilike('url', '%jiotv%')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    streams.forEach(s => {
        console.log(`\nName: ${s.name}`);
        console.log(`URL: ${s.url}`);
        console.log(`Headers:`, s.headers);
        console.log(`Has Query Param? ${s.url.includes('__hdnea__=')}`);
    });
}

verifyMigration();
