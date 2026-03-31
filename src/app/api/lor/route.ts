import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lorData } from '@/db/schema';

export async function GET() {
    try {
        const data = await db.select().from(lorData);

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'No LOR data found' }, { status: 404 });
        }

        // Reconstruct the GeoJSON FeatureCollection
        const geojson = {
            type: 'FeatureCollection',
            name: 'lor_planungsraeume_2021',
            crs: {
                type: 'name',
                properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
            },
            features: data.map((item: any) => ({
                type: 'Feature',
                properties: {
                    ...item.properties
                },
                geometry: item.geometry
            }))
        };

        return NextResponse.json(geojson);
    } catch (error) {
        console.error('Error fetching LOR data:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
