import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const {
            name,
            url,
            category,
            logo,
            streamFormat,
            drmScheme,
            drmLicenseUrl,
            drmKeyId,
            drmKey,
            headers,
            channelNumber
        } = await request.json();

        console.log('Add channel request received:', {
            name, url, category, logo, streamFormat, drmScheme, drmLicenseUrl, channelNumber
        });

        if (!name || !url) {
            console.log('Missing required fields');
            return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
        }

        // Generate a unique stream_id
        const stream_id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const channelData = {
            stream_id,
            name,
            url,
            logo: logo || null,
            category: category || 'Uncategorized',
            type: 'live',
            stream_format: streamFormat || 'hls',
            drm_scheme: drmScheme || null,
            drm_license_url: drmLicenseUrl || null,
            drm_key_id: drmKeyId || null,
            drm_key: drmKey || null,
            headers: headers ? JSON.stringify(headers) : null,
            channel_number: channelNumber ? parseInt(channelNumber) : null
        };

        const { data, error } = await supabase
            .from('streams')
            .insert([channelData])
            .select();

        console.log('Supabase insert result:', { data, error });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Add channel route error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
