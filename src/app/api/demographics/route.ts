import { NextResponse } from 'next/server';
import { db } from '@/db';
import { demographics } from '@/db/schema';

export const revalidate = 86400; // 24 hours

export async function GET() {
    try {
        const data = await db.select().from(demographics);

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No demographics data found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching demographics:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
