import { NextResponse } from 'next/server';
import { db } from '@/db';
import { disabledParkingSpaces } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await db.select().from(disabledParkingSpaces);

        // Reconstruct GeoJSON
        const geojson = {
            type: 'FeatureCollection',
            features: data.map((item: any) => ({
                type: 'Feature',
                id: item.id,
                geometry: item.geometry,
                properties: item.properties
            }))
        };

        return NextResponse.json(geojson);
    } catch (error) {
        console.error('Disabled Parking API Route Error:', error);
        return NextResponse.json({ error: 'Failed to load disabled parking data' }, { status: 500 });
    }
}
