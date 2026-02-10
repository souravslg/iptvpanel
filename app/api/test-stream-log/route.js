import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    const testData = {
        username: 'api_test_user',
        stream_id: 'api_test_stream',
        stream_name: 'API Test Channel',
        ip_address: '127.0.0.1',
        user_agent: 'API Test',
        last_ping: new Date().toISOString(),
        started_at: new Date().toISOString()
    };

    console.log('🧪 Testing INSERT from API route...');
    console.log('Test Data:', testData);

    try {
        const { data, error } = await supabaseAdmin
            .from('active_streams')
            .insert(testData)
            .select();

        if (error) {
            console.error('❌ INSERT FAILED:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                code: error.code,
                details: error.details
            }, { status: 500 });
        }

        console.log('✅ INSERT SUCCESS from API route!');
        console.log('Inserted:', data[0]);

        // Clean up test record
        await supabaseAdmin
            .from('active_streams')
            .delete()
            .eq('username', 'api_test_user');

        return NextResponse.json({
            success: true,
            message: 'Stream logged successfully from API route',
            data: data[0]
        });

    } catch (error) {
        console.error('❌ Exception in API route:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
