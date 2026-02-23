import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lorId = searchParams.get('lorId');

    if (!lorId) {
        return NextResponse.json({ error: 'lorId is required' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'data/processed/lor_details', `${lorId}.json`);

        if (!fs.existsSync(filePath)) {
            // It's possible a valid LOR just has no businesses, or the file wasn't generated. Return empty array.
            return NextResponse.json([]);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading business details:', error);
        return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
    }
}
