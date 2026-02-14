import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get playlist analytics
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const period = searchParams.get('period') || '7d'; // 24h, 7d, 30d

        // Calculate time range
        let since;
        switch (period) {
            case '24h':
                since = new Date(Date.now() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }

        let query = supabaseAdmin
            .from('playlist_access_logs')
            .select('*')
            .gte('accessed_at', since.toISOString())
            .order('accessed_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: logs, error } = await query;

        if (error) throw error;

        // Calculate statistics
        const stats = {
            totalAccesses: logs.length,
            uniqueUsers: new Set(logs.map(l => l.user_id)).size,
            totalStreamsServed: logs.reduce((sum, log) => sum + (log.stream_count || 0), 0),
            averageStreamsPerAccess: logs.length > 0
                ? Math.round(logs.reduce((sum, log) => sum + (log.stream_count || 0), 0) / logs.length)
                : 0,
            uniqueIPs: new Set(logs.map(l => l.ip_address)).size,
            recentAccesses: logs.slice(0, 10) // Last 10 accesses
        };

        // Group by date for chart
        const accessesByDate = {};
        logs.forEach(log => {
            const date = new Date(log.accessed_at).toISOString().split('T')[0];
            accessesByDate[date] = (accessesByDate[date] || 0) + 1;
        });

        return NextResponse.json({
            period,
            since: since.toISOString(),
            stats,
            accessesByDate
        });

    } catch (error) {
        console.error('Failed to fetch analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
