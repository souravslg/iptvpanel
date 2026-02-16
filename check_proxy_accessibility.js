// Check what protocol/host the proxy is using

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkProxyUrl() {
    console.log('=== Checking Proxy URL Construction ===\n');

    // Simulate what player_api does
    const protocol = 'http'; // or https
    const host = 'localhost:3000'; // Change to your actual domain
    const username = 'home2';
    const password = 'home2';
    const streamId = '144';
    const extension = 'mpd';

    const proxyUrl = `${protocol}://${host}/live/${username}/${password}/${streamId}.${extension}`;

    console.log('Generated Proxy URL:', proxyUrl);
    console.log('');
    console.log('IMPORTANT: For TiviMate to work, this URL must be:');
    console.log('1. Publicly accessible (not localhost)');
    console.log('2. Using HTTP or HTTPS (TiviMate supports both)');
    console.log('3. Returning proper DASH manifest with correct headers');
    console.log('');
    console.log('Current Issues:');
    console.log('- If using localhost: TiviMate on a TV/phone cannot reach localhost');
    console.log('- Solution: Use your local IP address (e.g., http://192.168.1.100:3000)');
    console.log('  or deploy to a public server (Vercel, DigitalOcean, etc.)');
}

checkProxyUrl();
