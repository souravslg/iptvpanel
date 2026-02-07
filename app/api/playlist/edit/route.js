import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const {
            id,
            url,
            drmScheme,
            drmLicenseUrl,
            drmKeyId,
            drmKey,
            streamFormat,
            channelNumber
        } = await request.json();

        console.log('Edit request received:', {
            id,
            url,
            drmScheme,
            drmLicenseUrl,
            drmKeyId: drmKeyId ? '***' : null,
            drmKey: drmKey ? '***' : null,
            streamFormat,
            channelNumber
        });

        if (!id || !url) {
            console.log('Missing id or url');
            return NextResponse.json({ error: 'Missing id or url' }, { status: 400 });
        }

        // Build update object with all fields
        const updateData = {
            url,
            drm_scheme: drmScheme || null,
            drm_license_url: drmLicenseUrl || null,
            drm_key_id: drmKeyId || null,
            drm_key: drmKey || null,
            stream_format: streamFormat || 'hls',
            channel_number: channelNumber || null
        };

        const { data, error } = await supabase
            .from('streams')
            .update(updateData)
            .eq('id', id)
            .select();

        console.log('Supabase update result:', { data, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Edit route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
