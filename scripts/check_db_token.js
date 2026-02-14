const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStream() {
    const { data, error } = await supabase
        .from('streams')
        .select('url')
        .ilike('url', '%__hdnea__%')
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Streams with __hdnea__ token in URL:', data.length);
        if (data.length > 0) {
            console.log('Sample URL:', data[0].url);
        } else {
            console.log('No streams found with __hdnea__ token in URL.');
        }
    }
}

checkStream();
