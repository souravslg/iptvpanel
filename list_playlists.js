const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utfblxhfyoebonlgtbwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0ZmJseGhmeW9lYm9ubGd0Ynd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4NjE0NSwiZXhwIjoyMDg2MDYyMTQ1fQ.2J-VqExPDqUJTWwciEGnLeIC7YGTUCCvWRoZp9mRZLk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listPlaylists() {
    const { data, error } = await supabase
        .from('playlists')
        .select('*');

    if (error) {
        console.error('Error fetching playlists:', error);
        return;
    }

    console.log('Playlists:');
    data.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.name}, Source: ${p.source_url}`);
    });
}

listPlaylists();
