import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses } from '@/db/schema';
import { and, ilike, like, sql as drizzleSql } from 'drizzle-orm';

const DEFAULT_LIMIT = 2000;
const MAX_LIMIT = 5000;
const MAX_QUERY_LENGTH = 100;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const limit = Number.isNaN(limitParam) ? DEFAULT_LIMIT : Math.min(Math.max(limitParam, 1), MAX_LIMIT);
    const districtId = searchParams.get('districtId');

    if (!query) {
        return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return NextResponse.json({ error: 'query is too long' }, { status: 400 });
    }
    if (districtId && !/^\d{1,8}$/.test(districtId)) {
        return NextResponse.json({ error: 'Invalid districtId' }, { status: 400 });
    }

    // Escape LIKE wildcards so user input is matched literally
    const escapedQuery = query.replace(/[\\%_]/g, (c) => `\\${c}`);

    try {
        // Stage 1: Get 100% accurate counts using the RPC function
        // In Drizzle, we can call the function using raw SQL
        const countData = await db.execute(drizzleSql`SELECT * FROM get_business_counts(${escapedQuery}, ${districtId || null})`) as unknown as { lor_id: string, count: string }[];

        // Convert RPC result back to the expected key-value object
        const lorCounts: Record<string, number> = {};
        let totalMatched = 0;
        if (countData) {
            countData.forEach((row) => {
                lorCounts[row.lor_id] = Number(row.count);
                totalMatched += Number(row.count);
            });
        }

        // Stage 2: Fetch detailed points for the map
        const allPoints = await db.select({
            id: businesses.id,
            lat: businesses.lat,
            lng: businesses.lng,
            branch: businesses.branch,
            employees: businesses.employees,
            type: businesses.type,
            age: businesses.age,
            city: businesses.city,
            postcode: businesses.postcode,
            lorId: businesses.lor_id
        })
        .from(businesses)
        .where(
            and(
                ilike(businesses.branch, `%${escapedQuery}%`),
                districtId ? like(businesses.lor_id, `${districtId}%`) : undefined
            )
        )
        .limit(limit);

        return NextResponse.json({
            points: allPoints,
            lorCounts: lorCounts,
            totalMatched: totalMatched
        });
    } catch (error) {
        console.error('Error searching business data:', error);
        return NextResponse.json({ error: 'Failed to search business data' }, { status: 500 });
    }
}
