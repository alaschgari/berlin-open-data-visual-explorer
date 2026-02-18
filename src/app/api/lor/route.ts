import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'processed', 'lor_data.json');

        if (!(await fs.access(filePath).then(() => true).catch(() => false))) {
            return NextResponse.json({ error: 'Processed LOR data not found' }, { status: 404 });
        }

        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading LOR JSON:', error);
        return NextResponse.json({ error: 'Failed to load LOR data' }, { status: 500 });
    }
}
