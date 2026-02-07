import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { username, password, maxConnections, expireDate, package: pkg, notes } = await request.json();

        console.log('Create Xtream user request:', { username, password, maxConnections, expireDate, package: pkg });

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        // Check if username already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        // Create user
        const { data, error } = await supabase
            .from('users')
            .insert([{
                username,
                password, // In production, this should be hashed
                max_connections: maxConnections || 1,
                expire_date: expireDate ? new Date(expireDate).toISOString() : null,
                package: pkg || 'Full Package',
                notes: notes || '',
                status: 'Active'
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('User created:', data);

        return NextResponse.json({
            success: true,
            user: data
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
