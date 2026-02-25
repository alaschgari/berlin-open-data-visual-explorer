import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '2000'); // Increased default limit for pins
    const districtId = searchParams.get('districtId');

    if (!query) {
        return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    try {
        // Stage 1: Get 100% accurate counts using the RPC function
        const { data: countData, error: countError } = await supabase.rpc('get_business_counts', {
            search_query: query,
            district_filter: districtId || null
        });

        if (countError) {
            console.error('Error in business count RPC:', countError);
            // Fallback or handle error
        }

        // Convert RPC result back to the expected key-value object
        const lorCounts: Record<string, number> = {};
        let totalMatched = 0;
        if (countData) {
            countData.forEach((row: { lor_id: string, count: number }) => {
                lorCounts[row.lor_id] = Number(row.count);
                totalMatched += Number(row.count);
            });
        }

        // Stage 2: Fetch detailed points for the map (limited for performance)
        let pointsQuery = supabase
            .from('businesses')
            .select('id, lat, lng, branch, employees, type, age, city, postcode, lor_id')
            .ilike('branch', `%${query}%`)
            .limit(limit);

        if (districtId) {
            pointsQuery = pointsQuery.like('lor_id', `${districtId}%`);
        }

        const { data: pointsData, error: pointsError } = await pointsQuery;

        if (pointsError) {
            console.error('Error fetching business points:', pointsError);
        }

        const results = pointsData || [];

        return NextResponse.json({
            points: results.map(item => ({
                id: item.id,
                lat: item.lat,
                lng: item.lng,
                branch: item.branch,
                employees: item.employees,
                type: item.type,
                age: item.age,
                city: item.city,
                postcode: item.postcode,
                lorId: item.lor_id
            })),
            lorCounts: lorCounts,
            totalMatched: totalMatched // Now reflects 100% of matching records!
        });
    } catch (error) {
        console.error('Error searching business data:', error);
        return NextResponse.json({ error: 'Failed to search business data' }, { status: 500 });
    }
}
