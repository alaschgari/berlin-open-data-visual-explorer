import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businesses } from '@/db/schema';
import { eq } from 'drizzle-orm';

const MAX_RESULTS = 5000;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lorId = searchParams.get('lorId');

    if (!lorId) {
        return NextResponse.json({ error: 'lorId is required' }, { status: 400 });
    }
    if (!/^\d{1,10}$/.test(lorId)) {
        return NextResponse.json({ error: 'Invalid lorId' }, { status: 400 });
    }

    try {
        const allData = await db
            .select()
            .from(businesses)
            .where(eq(businesses.lor_id, lorId))
            .limit(MAX_RESULTS);

        // Map to the expected format
        const formattedData = allData.map(d => ({
            id: d.id,
            city: d.city,
            postcode: d.postcode,
            employees: d.employees,
            branch: d.branch,
            top_branch: d.top_branch,
            type: d.type,
            age: d.age,
            lat: d.lat,
            lng: d.lng
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Error fetching business details:', error);
        return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
    }
}
