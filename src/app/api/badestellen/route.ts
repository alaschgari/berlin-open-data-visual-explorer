import { NextResponse } from 'next/server';
import { getBadestellenLive, BadestelleFeature } from '@/lib/badestellen';

export const dynamic = 'force-dynamic';

export const revalidate = 10800; // 3 hours in seconds

export async function GET(request: Request) {
    try {
        // Fetch fresh data from LAGeSo
        // This function leverages Next.js fetch caching
        const data = await getBadestellenLive();

        return NextResponse.json({
            data,
            fromCache: false // Relies on edge cache
        });
    } catch (error) {
        console.error('Badestellen API Route Error:', error);

        return NextResponse.json({ error: 'Failed to fetch badestellen data' }, { status: 500 });
    }
}
