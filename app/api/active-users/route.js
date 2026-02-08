import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch active users with their details
        const { data: activeUsers, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('status', 'Active');

        if (usersError) {
            console.error('Error fetching active users:', usersError);
            return NextResponse.json({ error: 'Failed to fetch active users' }, { status: 500 });
        }

        // Filter out expired users
        const now = new Date();
        const validUsers = (activeUsers || []).filter(user => {
            if (!user.expire_date) return true;
            const expireDate = new Date(user.expire_date);
            const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const expireDateOnly = new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate());
            return expireDateOnly >= nowDate;
        });

        // Fetch currently active streams (last ping within 5 minutes)
        const { data: activeStreams, error: streamsError } = await supabase
            .from('active_streams')
            .select('*')
            .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());

        if (streamsError && streamsError.code !== 'PGRST116') { // PGRST116 = table doesn't exist
            console.error('Error fetching active streams:', streamsError);
        }

        // Get stream details for active streams
        const streamIds = [...new Set((activeStreams || []).map(s => s.stream_id))];
        let streamDetails = {};

        if (streamIds.length > 0) {
            const { data: streams } = await supabase
                .from('streams')
                .select('*')
                .in('stream_id', streamIds);

            if (streams) {
                streamDetails = streams.reduce((acc, stream) => {
                    acc[stream.stream_id] = stream;
                    return acc;
                }, {});
            }
        }

        // Combine user data with their active streams
        const usersWithStreams = validUsers.map(user => {
            const userStreams = (activeStreams || [])
                .filter(stream => stream.username === user.username)
                .map(stream => {
                    const streamInfo = streamDetails[stream.stream_id] || {};
                    return {
                        stream_id: stream.stream_id,
                        stream_name: streamInfo.name || stream.stream_name || 'Unknown',
                        category: streamInfo.category || 'Uncategorized',
                        logo: streamInfo.logo || '',
                        started_at: stream.started_at,
                        last_ping: stream.last_ping,
                        ip_address: stream.ip_address,
                        watching_duration: Math.floor((new Date() - new Date(stream.started_at)) / 1000)
                    };
                });

            return {
                id: user.id,
                username: user.username,
                max_connections: user.max_connections,
                expire_date: user.expire_date,
                status: user.status,
                package: user.package,
                created_at: user.created_at,
                active_streams: userStreams,
                current_connections: userStreams.length
            };
        });

        // Sort by users with active streams first
        usersWithStreams.sort((a, b) => b.current_connections - a.current_connections);

        return NextResponse.json({
            total_active_users: validUsers.length,
            users_watching_now: usersWithStreams.filter(u => u.current_connections > 0).length,
            users: usersWithStreams
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
