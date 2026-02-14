import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Public endpoint to serve M3U content with validation
export async function GET(request, context) {
    try {
        const params = await Promise.resolve(context.params);
        const { linkId } = params;

        // Fetch the shared link
        const { data: link, error } = await supabase
            .from('shared_links')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error || !link) {
            return new NextResponse('Link not found', { status: 404 });
        }

        // Check if link is active
        if (link.status !== 'Active') {
            return new NextResponse('Link is inactive', { status: 403 });
        }

        // Check expiry
        if (link.expire_date) {
            const expiryDate = new Date(link.expire_date);
            const now = new Date();
            if (now > expiryDate) {
                // Update status to Expired
                await supabase
                    .from('shared_links')
                    .update({ status: 'Expired' })
                    .eq('id', link.id);

                return new NextResponse('Link has expired', { status: 410 });
            }
        }

        // Check max uses
        if (link.max_uses !== null && link.current_uses >= link.max_uses) {
            return new NextResponse('Maximum uses exceeded', { status: 403 });
        }

        // Update usage statistics
        await supabase
            .from('shared_links')
            .update({
                current_uses: link.current_uses + 1,
                last_accessed_at: new Date().toISOString()
            })
            .eq('id', link.id);

        console.log('[SHARE] Fetching M3U from:', link.source_url);

        // Fetch M3U content from source URL
        const m3uResponse = await fetch(link.source_url);

        console.log('[SHARE] M3U Fetch Status:', m3uResponse.status, m3uResponse.statusText);

        if (!m3uResponse.ok) {
            console.error('[SHARE] Failed to fetch M3U:', m3uResponse.status);
            throw new Error(`Failed to fetch M3U content: ${m3uResponse.status} ${m3uResponse.statusText}`);
        }

        const m3uContent = await m3uResponse.text();

        console.log('[SHARE] M3U Content length:', m3uContent.length, 'bytes');

        // Return M3U content with appropriate headers
        return new NextResponse(m3uContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Content-Disposition': `attachment; filename="${link.name}.m3u"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('[SHARE] Failed to serve M3U content:', error);
        console.error('[SHARE] Error stack:', error.stack);
        return new NextResponse(`Internal server error: ${error.message}`, { status: 500 });
    }
}
