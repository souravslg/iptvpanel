import { supabase } from './lib/supabase.js';
import http from 'http';

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: null, text: data });
                }
            });
        }).on('error', reject);
    });
}

async function debugData() {
    console.log('=== DEBUGGING STREAM DATA ===');

    // 1. Check DB for ALL Vande Gujarat streams
    console.log('\n1. DB STREAMS:');
    const { data: dbStreams, error } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Vande Gujarat%');

    if (dbStreams) {
        dbStreams.forEach(s => {
            console.log(`[${s.id}] ${s.name}`);
            console.log(`   URL: ${s.url}`);
            console.log(`   Headers: ${s.headers}`);
        });
    }

    // 2. Check API Response
    console.log('\n2. API RESPONSE:');
    const apiUrl = 'http://localhost:3000/player_api.php?username=home2&password=home2&action=get_live_streams';
    try {
        const { data: apiStreams } = await fetch(apiUrl);
        if (apiStreams && Array.isArray(apiStreams)) {
            const vande = apiStreams.find(s => s.name && s.name.includes('Vande Gujarat 1'));
            if (vande) {
                console.log(`[API] ${vande.name}`);
                console.log(`   Direct Source: ${vande.direct_source}`);
                console.log(`   JSON: ${JSON.stringify(vande)}`);
            } else {
                console.log('   Vande Gujarat 1 not found in API response');
            }
        }
    } catch (e) {
        console.error('   API Error:', e);
    }
}

debugData();
