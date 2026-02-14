const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function activatePlaylist() {
    console.log('Activating Playlist 43...');

    // Update name and is_active
    const { data, error } = await supabase
        .from('playlists')
        .update({
            is_active: true,
            name: 'JioTV Xtream'
        })
        .eq('id', 44)
        .select();

    if (error) {
        console.error('Error updating playlist:', error);
        return;
    }

    console.log('Updated Playlist:', data);
}

activatePlaylist();
