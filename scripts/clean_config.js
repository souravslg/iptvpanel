
import { supabase } from '../lib/supabase.js';

const REQUESTED_URL = 'https://raw.githubusercontent.com/souravslg/iptvpanel/main/jtv.m3u';

async function cleanConfig() {
    console.log('--- Starting Xtream Config Cleanup ---');

    // 1. Deactivate ALL playlists first
    console.log('1. Deactivating all playlists...');
    const { error: deactivateError } = await supabase
        .from('playlists')
        .update({ is_active: false })
        .neq('id', -1); // Update all

    if (deactivateError) {
        console.error('Error deactivating playlists:', deactivateError);
        return;
    }
    console.log('   All playlists deactivated.');

    // 2. Setting JTV Auto-Gen as active (or creating it)
    console.log('2. Ensuring "JTV Auto-Gen" playlist is active...');
    let { data: jtvPlaylist, error: fetchError } = await supabase
        .from('playlists')
        .select('*')
        .eq('name', 'JTV Auto-Gen')
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching JTV playlist:', fetchError);
    }

    if (jtvPlaylist) {
        // Update existing
        const { error: updateError } = await supabase
            .from('playlists')
            .update({
                is_active: true,
                source_url: 'local:jtv.m3u'
            })
            .eq('id', jtvPlaylist.id);

        if (updateError) console.error('Error updating JTV playlist:', updateError);
        else console.log(`   Updated existing playlist "${jtvPlaylist.name}" (ID: ${jtvPlaylist.id}) to active.`);

    } else {
        // Create new
        const { data: newPlaylist, error: createError } = await supabase
            .from('playlists')
            .insert({
                name: 'JTV Auto-Gen',
                description: 'Auto-generated JTV playlist',
                is_active: true,
                total_channels: 0, // Will be updated on sync
                source_url: 'local:jtv.m3u'
            })
            .select()
            .single();

        if (createError) console.error('Error creating JTV playlist:', createError);
        else console.log(`   Created new active playlist "${newPlaylist.name}" (ID: ${newPlaylist.id}).`);
    }

    // 3. Update Settings with target URL
    console.log(`3. Setting jtv_playlist_url to "${REQUESTED_URL}"...`);
    const { error: settingError } = await supabase
        .from('settings')
        .upsert({
            key: 'jtv_playlist_url',
            value: REQUESTED_URL
        }, { onConflict: 'key' });

    if (settingError) console.error('Error updating settings:', settingError);
    else console.log('   Settings updated successfully.');

    // 4. Force a fake "expired" date on non-active users? (Optional - user didn't ask for this explicitly, but "clean previous config" might imply ensuring only valid users)
    // Skipping user cleanup for now to avoid accidental data loss.

    console.log('--- Cleanup Complete ---');
}

cleanConfig();
