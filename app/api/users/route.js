import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password, maxConnections, expireDate, packageName, notes } = body;

        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password,
                    max_connections: maxConnections || 1,
                    expire_date: expireDate,
                    package: packageName,
                    notes
                }
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint
                return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, username, password, maxConnections, expireDate, packageName, status, notes } = body;
        const updates = {};

        // Add all fields that are provided
        if (username) updates.username = username;
        if (password) updates.password = password;
        if (maxConnections) updates.max_connections = maxConnections;
        if (expireDate) updates.expire_date = expireDate;
        if (packageName) updates.package = packageName;
        if (status) updates.status = status;
        if (notes !== undefined) updates.notes = notes;

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id);

        if (error) {
            if (error.code === '23505') { // Unique constraint
                return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
