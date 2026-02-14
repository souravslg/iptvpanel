#!/usr/bin/env node

/**
 * User Playlist System - Database Setup Script
 * ============================================
 * This script sets up the database tables for user-specific playlists
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n🚀 Setting up User Playlist System...\n');

async function setupDatabase() {
    try {
        // Check if tables already exist
        console.log('Checking existing tables...');

        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .in('table_name', ['user_channel_permissions', 'user_devices', 'playlist_access_logs']);

        if (tableError) {
            console.log('⚠️  Cannot check existing tables (this is normal)');
        }

        console.log('\n📋 MANUAL SETUP REQUIRED:\n');
        console.log('Please run the SQL migration in your Supabase dashboard:');
        console.log('👉 https://supabase.com/dashboard/project/utfblxhfyoebonlgtbwz/editor\n');
        console.log('SQL file: migrations/user_playlist_system.sql\n');

        console.log('═══════════════════════════════════════════════════════\n');
        console.log('The migration will:');
        console.log('  ✓ Add playlist_token to users table');
        console.log('  ✓ Add device_limit to users table');
        console.log('  ✓ Create user_channel_permissions table');
        console.log('  ✓ Create user_devices table');
        console.log('  ✓ Create playlist_access_logs table');
        console.log('\n═══════════════════════════════════════════════════════\n');

        console.log('After running the SQL, you can verify with:');
        console.log('  → node verify_user_playlists.mjs\n');

    } catch (error) {
        console.error('❌ Setup check failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();
