const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual env parsing
let env = {};
try {
    let envContent = '';
    if (fs.existsSync('.env.local')) envContent += fs.readFileSync('.env.local', 'utf8') + '\n';
    if (fs.existsSync('.env')) envContent += fs.readFileSync('.env', 'utf8') + '\n';

    envContent.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) { console.log(e); }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase.from('active_streams').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message, error.code);
    } else {
        console.log('Table exists. Sample:', data);
    }
}

checkTable();
