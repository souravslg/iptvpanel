import { supabase } from './lib/supabase.js';

async function checkDatabaseSchema() {
    console.log('🔍 Checking Supabase database schema...\n');

    try {
        // Test 1: Check if we can connect
        console.log('1. Testing connection...');
        const { data: testData, error: testError } = await supabase
            .from('streams')
            .select('*')
            .limit(1);

        if (testError) {
            console.error('❌ Connection failed:', testError.message);
            return;
        }
        console.log('✅ Connection successful\n');

        // Test 2: Try to insert a test record with DRM fields
        console.log('2. Testing DRM fields...');
        const testStream = {
            stream_id: 'test-' + Date.now(),
            name: 'Test Stream',
            url: 'https://test.com/stream.m3u8',
            category: 'Test',
            playlist_id: null,
            drm_scheme: 'widevine',
            drm_license_url: 'https://test.com/license',
            drm_key_id: 'test123',
            drm_key: 'key123',
            stream_format: 'hls',
            channel_number: 1
        };

        const { data: insertData, error: insertError } = await supabase
            .from('streams')
            .insert([testStream])
            .select();

        if (insertError) {
            console.error('❌ DRM fields test failed:', insertError.message);
            console.error('Error details:', insertError);

            if (insertError.message.includes('column') || insertError.message.includes('does not exist')) {
                console.log('\n⚠️  DRM columns are missing from the database!');
                console.log('\n📋 You need to run the DRM migration SQL in Supabase:');
                console.log('   File: migrations/add_drm_support.sql\n');
            }
            return;
        }

        console.log('✅ DRM fields exist and working!');

        // Clean up test record
        await supabase
            .from('streams')
            .delete()
            .eq('stream_id', testStream.stream_id);

        console.log('✅ Test record cleaned up\n');

        // Test 3: Check playlists table
        console.log('3. Testing playlists table...');
        const { data: playlistData, error: playlistError } = await supabase
            .from('playlists')
            .select('*')
            .limit(1);

        if (playlistError) {
            console.error('❌ Playlists table error:', playlistError.message);
            return;
        }
        console.log('✅ Playlists table exists\n');

        console.log('🎉 All checks passed! Database schema is correct.\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkDatabaseSchema();
