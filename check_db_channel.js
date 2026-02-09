const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChannel() {
    const { data, error } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%CNBC Awaaz%')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }
    console.log(data[0]);
}

checkChannel();
