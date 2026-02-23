import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data/processed', 'business_aggregated.json.gz');
        const compressedContent = fs.readFileSync(filePath);
        const fileContent = zlib.gunzipSync(compressedContent).toString('utf8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading business data:', error);
        return NextResponse.json({ error: 'Failed to load business data' }, { status: 500 });
    }
}
