// Run this script to apply the playlists migration to Supabase
// Usage: node apply_migration.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODYxNDUsImV4cCI6MjA4NjA2MjE0NX0.PW4mXEVIiXn3-ABpOQ8VMerJL2WwaoQREc6l5ZrPv6Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
    console.log('🚀 Starting migration...\n');

    try {
        // Check if playlists table exists
        console.log('1️⃣  Checking if playlists table exists...');
        const { data: existingPlaylists, error: checkError } = await supabase
            .from('playlists')
            .select('id')
            .limit(1);

        if (!checkError) {
            console.log('✅ Playlists table already exists!');
            console.log('   Checking for active playlist...');

            const { data: activePlaylists } = await supabase
                .from('playlists')
                .select('*')
                .eq('is_active', true);

            if (activePlaylists && activePlaylists.length > 0) {
                console.log(`✅ Active playlist found: "${activePlaylists[0].name}"`);
                console.log('\n✨ Migration already applied. Your database is ready!');
                return;
            } else {
                console.log('⚠️  No active playlist found. Creating default playlist...');

                // Create default playlist
                const { data: newPlaylist, error: createError } = await supabase
                    .from('playlists')
                    .insert({
                        name: 'Default Playlist',
                        description: 'Main playlist',
                        is_active: true,
                        total_channels: 0
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('❌ Error creating default playlist:', createError);
                    throw createError;
                }

                console.log(`✅ Created default playlist: "${newPlaylist.name}"`);
                console.log('\n✨ Migration completed successfully!');
                return;
            }
        }

        // If we get here, the table doesn't exist
        console.log('⚠️  Playlists table does not exist.');
        console.log('\n📋 MANUAL ACTION REQUIRED:');
        console.log('   The playlists table needs to be created using the Supabase SQL Editor.');
        console.log('   Please follow these steps:\n');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Click "SQL Editor" in the left sidebar');
        console.log('   4. Copy the SQL from migrations/add_multiple_playlists.sql');
        console.log('   5. Paste and run it in the SQL Editor\n');
        console.log('   Or check the FIX_IMPORT_ERROR.md file for detailed instructions.');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.log('\n📋 Please run the migration manually using the Supabase SQL Editor.');
        console.log('   See FIX_IMPORT_ERROR.md for instructions.');
    }
}

applyMigration();
