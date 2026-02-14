import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - List user's devices
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_seen', { ascending: false });

        if (error) throw error;

        // Mark devices as active if seen in last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const devicesWithStatus = data.map(device => ({
            ...device,
            is_currently_active: new Date(device.last_seen) > fiveMinutesAgo
        }));

        return NextResponse.json(devicesWithStatus);

    } catch (error) {
        console.error('Failed to fetch devices:', error);
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
}

// DELETE - Revoke specific device
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json({ error: 'deviceId required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('user_devices')
            .update({ is_active: false })
            .eq('id', deviceId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to revoke device:', error);
        return NextResponse.json({ error: 'Failed to revoke device' }, { status: 500 });
    }
}
