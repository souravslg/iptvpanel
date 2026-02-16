// Diagnose why only some channels work

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseChannels() {
    console.log('=== Diagnosing Channel Issues ===\n');

    // Get all enabled streams
    const { data: streams } = await supabase
        .from('streams')
        .select('*')
        .eq('enabled', true)
        .limit(2000);

    console.log(`Total enabled streams: ${streams.length}\n`);

    // Categorize streams
    const categories = {
        hasCookie: [],
        noCookie: [],
        hasDRM: [],
        noDRM: [],
        hasBoth: [],
        hasNeither: []
    };

    streams.forEach(stream => {
        const headers = stream.headers ? (typeof stream.headers === 'string' ? JSON.parse(stream.headers) : stream.headers) : {};
        const hasCookie = headers.Cookie || headers.cookie;
        const hasDRM = (stream.drm_key_id && stream.drm_key) || stream.drm_license_url;

        if (hasCookie) categories.hasCookie.push(stream);
        else categories.noCookie.push(stream);

        if (hasDRM) categories.hasDRM.push(stream);
        else categories.noDRM.push(stream);

        if (hasCookie && hasDRM) categories.hasBoth.push(stream);
        else if (!hasCookie && !hasDRM) categories.hasNeither.push(stream);
    });

    console.log('Channel Categorization:');
    console.log(`✓ Has Cookie: ${categories.hasCookie.length}`);
    console.log(`✗ No Cookie: ${categories.noCookie.length}`);
    console.log(`✓ Has DRM Keys: ${categories.hasDRM.length}`);
    console.log(`✗ No DRM Keys: ${categories.noDRM.length}`);
    console.log(`✓ Has BOTH Cookie + DRM: ${categories.hasBoth.length}`);
    console.log(`✗ Has NEITHER: ${categories.hasNeither.length}`);

    // Check specific channels
    console.log('\n=== Checking Specific Channels ===');

    const testChannels = [
        'Star Sports 1 HD',
        'Star Sports Select 1 HD',
        'Colors HD',
        'Zee TV HD',
        'Sony HD',
        'Zee Cafe HD'
    ];

    for (const channelName of testChannels) {
        const { data: channel } = await supabase
            .from('streams')
            .select('*')
            .ilike('name', `%${channelName}%`)
            .limit(1)
            .single();

        if (channel) {
            const headers = channel.headers ? (typeof channel.headers === 'string' ? JSON.parse(channel.headers) : channel.headers) : {};
            const hasCookie = !!(headers.Cookie || headers.cookie);
            const hasDRM = !!(channel.drm_key_id && channel.drm_key);

            console.log(`\n${channel.name}:`);
            console.log(`  Cookie: ${hasCookie ? '✓' : '✗'}`);
            console.log(`  DRM Keys: ${hasDRM ? '✓' : '✗'}`);
            console.log(`  Format: ${channel.stream_format || 'unknown'}`);
            console.log(`  URL: ${channel.url?.substring(0, 60)}...`);

            if (hasDRM) {
                console.log(`  Key ID: ${channel.drm_key_id?.substring(0, 16)}...`);
                console.log(`  Key: ${channel.drm_key?.substring(0, 16)}...`);
            }
        } else {
            console.log(`\n${channelName}: NOT FOUND`);
        }
    }

    // Find channels without cookies or DRM
    console.log('\n=== Channels Missing Cookie or DRM (sample) ===');
    const problematic = categories.hasNeither.slice(0, 10);
    problematic.forEach(ch => {
        console.log(`- ${ch.name} (format: ${ch.stream_format || 'unknown'})`);
    });

    console.log(`\n... and ${Math.max(0, categories.hasNeither.length - 10)} more`);

    // Summary
    console.log('\n=== DIAGNOSIS ===');
    if (categories.hasNeither.length > 100) {
        console.log(`⚠️  ${categories.hasNeither.length} channels have NO cookie AND NO DRM keys!`);
        console.log('These channels will fail to play.');
        console.log('\nPossible causes:');
        console.log('1. Source M3U doesn\'t have cookies for these channels');
        console.log('2. DRM key parsing failed for these channels');
        console.log('3. These channels use different authentication');
        console.log('\nSolution: Check the source M3U for these channels');
    } else {
        console.log('Most channels have proper authentication data.');
    }
}

diagnoseChannels().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
