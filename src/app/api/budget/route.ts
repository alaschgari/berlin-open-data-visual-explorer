import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const revalidate = 86400; // 24 hours

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || '2026';

    const filePath = path.join(process.cwd(), 'data', 'processed', `budget_${year}.json`);

    try {
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Data not found' }, { status: 404 });
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
    }
}
