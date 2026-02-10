import { NextResponse } from 'next/server';

export async function GET(request) {
    // Return empty XMLTV for now to satisfy players checking for it
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv generator-info-name="Xtream Codes" generator-info-url="http://www.xtream-codes.com/">
</tv>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
