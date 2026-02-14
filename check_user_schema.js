const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserSchema() {
    // Check users table columns by selecting one row
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('User sample:', users[0]);
    }

    // Check if there is a mapping table
    const { data: mapping, error: mapError } = await supabase
        .from('user_playlists')
        .select('*')
        .limit(1);

    if (mapError) {
        console.log('user_playlists table might not exist:', mapError.message);
    } else {
        console.log('user_playlists sample:', mapping);
    }
}

checkUserSchema();
