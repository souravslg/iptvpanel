import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch Total Users
        const { count: totalUsers, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Fetch Active Users
        const { count: activeUsers, error: activeUsersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active');

        // Fetch Total Streams (Playlist Items)
        const { count: totalStreams, error: streamsError } = await supabase
            .from('streams')
            .select('*', { count: 'exact', head: true });

        if (usersError || activeUsersError || streamsError) {
            console.error('Error fetching stats:', usersError || activeUsersError || streamsError);
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            totalStreams: totalStreams || 0
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 });
    }
}
