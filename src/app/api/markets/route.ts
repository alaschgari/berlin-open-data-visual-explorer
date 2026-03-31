import { NextResponse } from 'next/server';
import { db } from '@/db';
import { markets } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await db.select().from(markets);

        // Reconstruct GeoJSON
        const geojson = {
            type: 'FeatureCollection',
            features: data.map((item: any) => ({
                type: 'Feature',
                geometry: item.geometry,
                properties: item.properties
            }))
        };

        return NextResponse.json(geojson);
    } catch (error) {
        console.error('Markets API Route Error:', error);
        return NextResponse.json({ error: 'Failed to load markets data' }, { status: 500 });
    }
}
