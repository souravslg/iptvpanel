import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const action = searchParams.get('action');

    if (!username || !password) {
        return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Authenticate User
    const { data: user, error: authError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (authError || !user) {
        return NextResponse.json({ user_info: { auth: 0 }, error: 'Authentication failed' }, { status: 401 });
    }

    if (user.status !== 'Active') {
        return NextResponse.json({ user_info: { auth: 0, status: user.status }, error: 'User is not active' }, { status: 403 });
    }

    // Handle Login (No Action)
    if (!action) {
        const host = request.headers.get('host');
        const port = host.split(':')[1] || '80';
        const domain = host.split(':')[0];

        return NextResponse.json({
            user_info: {
                username: user.username,
                password: user.password,
                message: "Logged In",
                auth: 1,
                status: "Active",
                exp_date: user.expire_date ? new Date(user.expire_date).getTime() / 1000 : null,
                is_trial: "0",
                active_cons: "0",
                created_at: new Date(user.created_at).getTime() / 1000,
                max_connections: user.max_connections.toString(),
                allowed_output_formats: ["m3u8", "ts", "rtmp"]
            },
            server_info: {
                url: domain,
                port: port,
                https_port: "443",
                server_protocol: "http",
                rtmp_port: "8880",
                timezone: "UTC",
                timestamp_now: Math.floor(Date.now() / 1000),
                time_now: new Date().toISOString()
            }
        });
    }

    // Get Categories
    if (action === 'get_live_categories') {
        // Inefficient but functional without RPC for unique
        const { data, error } = await supabase
            .from('streams')
            .select('category')
            .eq('type', 'live');

        if (error) return NextResponse.json([]);

        const uniqueCategories = [...new Set(data.map(item => item.category))];

        return NextResponse.json(uniqueCategories.map((c, index) => ({
            category_id: index + 1, // Simple ID generation
            category_name: c || 'Uncategorized',
            parent_id: 0
        })));
    }

    // Get Streams
    if (action === 'get_live_streams') {
        const categoryId = searchParams.get('category_id');

        // Fetch all streams for now, mapping logic is client-side in this simple implementation
        const { data: streams, error } = await supabase
            .from('streams')
            .select('*')
            .eq('type', 'live');

        if (error) return NextResponse.json([]);

        // Get categories to rebuild the map (needed for ID consistency)
        const { data: catData } = await supabase.from('streams').select('category').eq('type', 'live');
        const uniqueCategories = [...new Set((catData || []).map(item => item.category))];
        const catMap = {};
        uniqueCategories.forEach((c, i) => catMap[c || 'Uncategorized'] = i + 1);

        return NextResponse.json(streams.map(s => ({
            num: s.id,
            name: s.name,
            stream_type: "live",
            stream_id: s.id,
            stream_icon: s.logo,
            epg_channel_id: null,
            added: new Date(s.created_at).getTime() / 1000,
            category_id: catMap[s.category || 'Uncategorized'] || 0,
            custom_sid: "",
            tv_archive: 0,
            direct_source: "",
            tv_archive_duration: 0
        })));
    }

    return NextResponse.json({});
}
