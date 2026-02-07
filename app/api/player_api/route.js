import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const password = searchParams.get('password');
        const action = searchParams.get('action');

        console.log('Xtream API request:', { username, password, action });

        if (!username || !password) {
            return NextResponse.json({
                user_info: { auth: 0, message: 'Invalid credentials' }
            }, { status: 401 });
        }

        // Authenticate user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !user) {
            console.log('Authentication failed:', error);
            return NextResponse.json({
                user_info: { auth: 0, message: 'Invalid credentials' }
            }, { status: 401 });
        }

        // Check if user is active and not expired
        const now = new Date();
        const expireDate = user.expire_date ? new Date(user.expire_date) : null;
        const isExpired = expireDate && expireDate < now;
        const isActive = user.status === 'Active' && !isExpired;

        if (!isActive) {
            return NextResponse.json({
                user_info: {
                    auth: 0,
                    message: isExpired ? 'Account expired' : 'Account inactive'
                }
            }, { status: 401 });
        }

        // Handle different actions
        if (action === 'get_live_streams' || action === 'get_vod_streams' || action === 'get_series') {
            // Get all streams
            const { data: streams } = await supabase
                .from('streams')
                .select('*');

            // Get server URL
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('host') || 'localhost:3000';
            const serverUrl = `${protocol}://${host}`;

            const formattedStreams = (streams || []).map(stream => {
                const streamId = stream.stream_id || stream.id;
                return {
                    num: stream.id,
                    name: stream.name,
                    stream_type: stream.type || 'live',
                    stream_id: streamId,
                    stream_icon: stream.logo || '',
                    category_id: stream.category || 'Uncategorized',
                    added: stream.created_at,
                    custom_sid: '',
                    tv_archive: 0,
                    direct_source: stream.url, // Original URL
                    tv_archive_duration: 0,
                    // Add container extension for compatibility
                    container_extension: 'ts'
                };
            });

            return NextResponse.json(formattedStreams);
        }

        if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
            // Get categories
            const { data: streams } = await supabase
                .from('streams')
                .select('category');

            const categories = [...new Set((streams || []).map(s => s.category).filter(Boolean))];
            const formattedCategories = categories.map((cat, idx) => ({
                category_id: idx + 1,
                category_name: cat,
                parent_id: 0
            }));

            return NextResponse.json(formattedCategories);
        }

        // Default: return user info
        return NextResponse.json({
            user_info: {
                username: user.username,
                password: user.password,
                message: 'Welcome',
                auth: 1,
                status: user.status,
                exp_date: expireDate ? Math.floor(expireDate.getTime() / 1000).toString() : null,
                is_trial: '0',
                active_cons: '0',
                created_at: user.created_at,
                max_connections: user.max_connections.toString(),
                allowed_output_formats: ['m3u8', 'ts', 'rtmp']
            },
            server_info: {
                url: request.headers.get('host') || 'localhost:3000',
                port: '80',
                https_port: '443',
                server_protocol: 'http',
                rtmp_port: '1935',
                timezone: 'Asia/Kolkata',
                timestamp_now: Math.floor(Date.now() / 1000),
                time_now: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Xtream API error:', error);
        return NextResponse.json({
            user_info: { auth: 0, message: 'Server error' }
        }, { status: 500 });
    }
}
