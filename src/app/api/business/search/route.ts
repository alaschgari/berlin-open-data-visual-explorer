import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '500');
    const districtId = searchParams.get('districtId');

    if (!query) {
        return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    try {
        // Query Supabase instead of local JSON
        let supabaseQuery = supabase
            .from('businesses')
            .select('id, lat, lng, branch, employees, type, age, city, postcode, lor_id')
            .ilike('branch', `%${query}%`)
            .limit(limit);

        if (districtId) {
            supabaseQuery = supabaseQuery.like('lor_id', `${districtId}%`);
        }

        const { data, error } = await supabaseQuery;

        if (error) {
            console.error('Error searching businesses in Supabase:', error);
            return NextResponse.json({ error: 'Failed to search business data' }, { status: 500 });
        }

        // Structure similar to old API for compatibility
        const results = data || [];
        const lorCounts: Record<string, number> = {};
        results.forEach(item => {
            const lorId = item.lor_id;
            lorCounts[lorId] = (lorCounts[lorId] || 0) + 1;
        });

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
            totalMatched: results.length // This is a bit different now as it's limited by 'limit'
        });
    } catch (error) {
        console.error('Error searching business data:', error);
        return NextResponse.json({ error: 'Failed to search business data' }, { status: 500 });
    }
}
