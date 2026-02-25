import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('lor_data')
            .select('*');

        if (error) {
            console.error('Supabase error fetching LOR data:', error);
            return NextResponse.json({ error: 'Failed to fetch LOR data from database' }, { status: 500 });
        }

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
            features: data.map(item => ({
                type: 'Feature',
                properties: {
                    PLR_ID: item.plr_id,
                    PLR_NAME: item.plr_name,
                    BEZ: item.bez,
                    STAND: item.stand,
                    GROESSE_M2: item.groesse_m2,
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
