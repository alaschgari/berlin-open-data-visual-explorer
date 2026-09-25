import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses } from '@/db/schema';
import { and, ilike, like, sql as drizzleSql } from 'drizzle-orm';
import { escapeLike, parseBusinessSearchParams } from '@/lib/validation';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const params = parseBusinessSearchParams(searchParams);
    if (!params.ok) {
        return NextResponse.json({ error: params.error }, { status: 400 });
    }
    const { limit, districtId } = params;
    const escapedQuery = escapeLike(params.query);

    try {
        // Stage 1: Get 100% accurate counts using the RPC function
        // In Drizzle, we can call the function using raw SQL
        const countResult = await db.execute<{ lor_id: string, count: string }>(drizzleSql`SELECT * FROM get_business_counts(${escapedQuery}, ${districtId || null})`);
        const countData = countResult.rows;

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
