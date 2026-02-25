import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('markets')
            .select('*');

        if (error) {
            console.error('Markets API Route Error:', error);
            return NextResponse.json({ error: 'Failed to load markets data' }, { status: 500 });
        }

        // Reconstruct GeoJSON
        const geojson = {
            type: 'FeatureCollection',
            features: data.map(item => ({
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
