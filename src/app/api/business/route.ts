import { NextResponse } from 'next/server';
import { db } from '@/db';
import { businessByLor, businesses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const data = await db.select().from(businessByLor);

        // Convert back to the expected format
        const byLor: Record<string, any> = {};
        if (data) {
            data.forEach((row: any) => {
                byLor[row.lor_id] = row.data;
            });
        }

        return NextResponse.json({ byLor });
    } catch (error) {
        console.error('Error fetching business data:', error);
        return NextResponse.json({ error: 'Failed to load business data' }, { status: 500 });
    }
}
