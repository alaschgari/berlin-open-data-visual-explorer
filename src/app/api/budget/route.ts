import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { financialRecords } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildBudgetTree } from '@/lib/budget-tree';

export const revalidate = 3600; // 1 hour

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const year = yearParam === null ? 2024 : parseInt(yearParam, 10);

    if (Number.isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
        return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }

    try {
        const allRecords = await db
            .select()
            .from(financialRecords)
            .where(eq(financialRecords.year, year));

        if (!allRecords || allRecords.length === 0) {
            return NextResponse.json({ name: 'Keine Daten', value: 0, children: [] });
        }

        const tree = buildBudgetTree(allRecords);
        return NextResponse.json(tree);
    } catch (error) {
        console.error(`[API Budget] Error:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
