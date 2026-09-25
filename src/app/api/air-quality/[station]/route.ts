import { NextResponse } from 'next/server';
import { getStationSeries, STATION_CODE_PATTERN } from '@/lib/air-quality';

export async function GET(_request: Request, { params }: { params: Promise<{ station: string }> }) {
    const { station } = await params;
    if (!STATION_CODE_PATTERN.test(station)) {
        return NextResponse.json({ error: 'Invalid station code' }, { status: 400 });
    }

    try {
        const series = await getStationSeries(station);
        return NextResponse.json({ series }, {
            headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' },
        });
    } catch (error) {
        console.error('[API Air Quality] Station error:', error);
        return NextResponse.json({ error: 'Failed to load station data' }, { status: 502 });
    }
}
