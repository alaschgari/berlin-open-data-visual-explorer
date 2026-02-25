import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lorId = searchParams.get('lorId');

    if (!lorId) {
        return NextResponse.json({ error: 'lorId is required' }, { status: 400 });
    }

    try {
        // Query all businesses in this LOR
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('lor_id', lorId);

        if (error) {
            console.error('Error fetching business details from Supabase:', error);
            return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
        }

        // Map to the expected format
        const formattedData = (data || []).map(d => ({
            id: d.id,
            city: d.city,
            postcode: d.postcode,
            employees: d.employees,
            branch: d.branch,
            top_branch: d.top_branch,
            type: d.type,
            age: d.age,
            lat: d.lat,
            lng: d.lng
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Error fetching business details:', error);
        return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
    }
}
