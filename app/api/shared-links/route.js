import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// Generate unique link ID
function generateLinkId() {
    return randomBytes(16).toString('hex');
}

// GET - List all shared links
export async function GET() {
    try {
        const { data: links, error } = await supabase
            .from('shared_links')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(links);
    } catch (error) {
        console.error('Failed to fetch shared links:', error);
        return NextResponse.json({ error: 'Failed to fetch shared links' }, { status: 500 });
    }
}

// POST - Create a new shared link
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, sourceUrl, expireDate, maxUses } = body;

        if (!name || !sourceUrl) {
            return NextResponse.json({ error: 'Name and source URL are required' }, { status: 400 });
        }

        const linkId = generateLinkId();

        const { data, error } = await supabase
            .from('shared_links')
            .insert([
                {
                    link_id: linkId,
                    name,
                    source_url: sourceUrl,
                    expire_date: expireDate || null,
                    max_uses: maxUses || null,
                    current_uses: 0,
                    status: 'Active'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to create shared link:', error);
        return NextResponse.json({ error: 'Failed to create shared link' }, { status: 500 });
    }
}

// PUT - Update an existing shared link
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, sourceUrl, expireDate, maxUses, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const updates = {};
        if (name) updates.name = name;
        if (sourceUrl) updates.source_url = sourceUrl;
        if (expireDate !== undefined) updates.expire_date = expireDate;
        if (maxUses !== undefined) updates.max_uses = maxUses;
        if (status) updates.status = status;

        const { error } = await supabase
            .from('shared_links')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update shared link:', error);
        return NextResponse.json({ error: 'Failed to update shared link' }, { status: 500 });
    }
}

// DELETE - Delete a shared link
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('shared_links')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete shared link:', error);
        return NextResponse.json({ error: 'Failed to delete shared link' }, { status: 500 });
    }
}
