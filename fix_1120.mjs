import { supabase } from './lib/supabase.js';

async function fixStream1120() {
    console.log('Fixing stream 1120...');

    // 1. Delete the compiled/bad stream (89113)
    const { error: deleteError } = await supabase
        .from('streams')
        .delete()
        .eq('id', 89113);

    if (deleteError) console.error('Delete error:', deleteError);
    else console.log('Deleted bad stream 89113');

    // 2. Ensure the good stream (85086) has stream_id 1120
    const { data: goodStream, error: fetchError } = await supabase
        .from('streams')
        .select('*')
        .eq('id', 85086)
        .single();

    if (goodStream) {
        console.log('Good stream found:', goodStream.name);
        if (goodStream.stream_id != 1120) {
            const { error: updateError } = await supabase
                .from('streams')
                .update({ stream_id: 1120 })
                .eq('id', 85086);
            if (updateError) console.error('Update error:', updateError);
            else console.log('Updated good stream to use ID 1120');
        } else {
            console.log('Good stream already has ID 1120');
        }
    }
}

fixStream1120();
