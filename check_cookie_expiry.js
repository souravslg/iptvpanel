// Check if cookies have expired and when playlist was last refreshed

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCookieExpiry() {
    console.log('=== Checking Cookie Expiration ===\n');

    // Get a sample channel with cookie
    const { data: channel } = await supabase
        .from('streams')
        .select('*')
        .ilike('name', '%Colors HD%')
        .limit(1)
        .single();

    if (channel && channel.headers) {
        const headers = typeof channel.headers === 'string' ? JSON.parse(channel.headers) : channel.headers;
        const cookie = headers.Cookie || headers.cookie;

        console.log('Sample Channel: Colors HD');
        console.log('Cookie:', cookie?.substring(0, 100) + '...\n');

        // Parse cookie to check expiration
        if (cookie && cookie.includes('__hdnea__=')) {
            const match = cookie.match(/__hdnea__=st=(\d+)~exp=(\d+)/);
            if (match) {
                const startTime = parseInt(match[1]);
                const expTime = parseInt(match[2]);
                const now = Math.floor(Date.now() / 1000);

                const startDate = new Date(startTime * 1000);
                const expDate = new Date(expTime * 1000);
                const nowDate = new Date();

                console.log('Cookie Timestamps:');
                console.log(`Start: ${startDate.toLocaleString()}`);
                console.log(`Expire: ${expDate.toLocaleString()}`);
                console.log(`Now: ${nowDate.toLocaleString()}\n`);

                const hoursUntilExpiry = (expTime - now) / 3600;

                if (now > expTime) {
                    console.log('❌ COOKIE EXPIRED!');
                    console.log(`Expired ${Math.abs(hoursUntilExpiry).toFixed(1)} hours ago`);
                    console.log('\n🔧 SOLUTION: Refresh the playlist source to get fresh cookies');
                } else if (hoursUntilExpiry < 1) {
                    console.log(`⚠️  Cookie expiring in ${(hoursUntilExpiry * 60).toFixed(0)} minutes`);
                } else {
                    console.log(`✓ Cookie valid for ${hoursUntilExpiry.toFixed(1)} more hours`);
                }
            }
        }
    }

    // Check when playlist was last updated
    const { data: playlists } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_active', true);

    console.log('\n=== Active Playlists ===');
    for (const playlist of playlists) {
        const updated = new Date(playlist.updated_at);
        const now = new Date();
        const hoursAgo = (now - updated) / (1000 * 60 * 60);

        console.log(`\n${playlist.name}:`);
        console.log(`  Last updated: ${updated.toLocaleString()}`);
        console.log(`  (${hoursAgo.toFixed(1)} hours ago)`);

        if (hoursAgo > 24) {
            console.log('  ⚠️  Playlist not updated in over 24 hours');
        }
    }
}

checkCookieExpiry().catch(console.error);
