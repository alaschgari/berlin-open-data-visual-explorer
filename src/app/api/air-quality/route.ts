import { NextResponse } from 'next/server';
import { getAirStations } from '@/lib/air-quality';

// Rendered per request so a failed upstream call is never cached; the upstream fetches
// and the CDN cache the successful response (the index is published hourly)
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stations = await getAirStations();
        return NextResponse.json({ stations }, {
            headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' },
        });
    } catch (error) {
        console.error('[API Air Quality] Error:', error);
        return NextResponse.json({ error: 'Failed to load air quality data' }, { status: 502 });
    }
}
