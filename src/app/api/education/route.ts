import { NextResponse } from 'next/server';
import { getFacilities } from '@/lib/education';

// Rendered per request so a failed upstream call is never cached; the CDN caches the
// successful response for a day (the directories change a few times a year)
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const facilities = await getFacilities();
        return NextResponse.json({ facilities }, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
        });
    } catch (error) {
        console.error('[API Education] Error:', error);
        return NextResponse.json({ error: 'Failed to load education data' }, { status: 502 });
    }
}
