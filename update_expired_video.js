// Script to update the expired user video URL
import { supabase } from './lib/supabase.js';

async function updateExpiredUserVideo() {
    console.log('🎬 UPDATING EXPIRED USER VIDEO URL\n');
    console.log('='.repeat(60));

    // The video URL you want to show to expired users
    // Change this to your custom video URL
    const newVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    console.log('\n📹 New video URL:', newVideoUrl);
    console.log('\nThis video will be shown to:');
    console.log('  - Expired users');
    console.log('  - Inactive users');
    console.log('  - Users with status != "Active"');

    try {
        // Check if setting exists
        console.log('\n1️⃣ Checking if setting exists...');
        const { data: existing, error: checkError } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'invalid_subscription_video')
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Error checking settings:', checkError);
            return;
        }

        if (existing) {
            console.log('✅ Setting exists');
            console.log('   Current value:', existing.value);

            // Update existing setting
            console.log('\n2️⃣ Updating setting...');
            const { error: updateError } = await supabase
                .from('settings')
                .update({
                    value: newVideoUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('key', 'invalid_subscription_video');

            if (updateError) {
                console.error('❌ Failed to update:', updateError);
                return;
            }

            console.log('✅ Setting updated successfully!');
        } else {
            console.log('⚠️  Setting does not exist');

            // Insert new setting
            console.log('\n2️⃣ Creating new setting...');
            const { error: insertError } = await supabase
                .from('settings')
                .insert({
                    key: 'invalid_subscription_video',
                    value: newVideoUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('❌ Failed to insert:', insertError);
                return;
            }

            console.log('✅ Setting created successfully!');
        }

        // Verify the change
        console.log('\n3️⃣ Verifying change...');
        const { data: verified, error: verifyError } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'invalid_subscription_video')
            .single();

        if (verifyError) {
            console.error('❌ Verification failed:', verifyError);
            return;
        }

        console.log('✅ Verified!');
        console.log('\n' + '='.repeat(60));
        console.log('✅ SUCCESS!');
        console.log('\nCurrent expired user video URL:');
        console.log('  ', verified.value);
        console.log('\n💡 To change it again, edit the newVideoUrl variable in this script');
        console.log('   and run: node update_expired_video.js');

    } catch (error) {
        console.error('\n❌ FAILED:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

updateExpiredUserVideo();
