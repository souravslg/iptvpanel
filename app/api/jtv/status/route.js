
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const metadataPath = path.join(process.cwd(), 'public', 'jtv-metadata.json');
        if (fs.existsSync(metadataPath)) {
            const data = fs.readFileSync(metadataPath, 'utf8');
            return NextResponse.json(JSON.parse(data));
        }
        return NextResponse.json({ status: 'Never Run', lastUpdated: null });
    } catch (error) {
        return NextResponse.json({ status: 'Error', error: error.message }, { status: 500 });
    }
}
