import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lorId = searchParams.get('lorId');

    if (!lorId) {
        return NextResponse.json({ error: 'lorId is required' }, { status: 400 });
    }

    try {
        // Fetch total count first to handle LORs with > 1000 records
        const { count, error: countError } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true })
            .eq('lor_id', lorId);

        if (countError) {
            console.error('Error fetching business count:', countError);
            return NextResponse.json({ error: 'Failed to load business details' }, { status: 500 });
        }

        const totalCount = count || 0;
        const CHUNK_SIZE = 1000;
        const totalChunks = Math.ceil(totalCount / CHUNK_SIZE);

        const fetchPromises = [];
        for (let i = 0; i < totalChunks; i++) {
            fetchPromises.push(
                supabase
                    .from('businesses')
                    .select('*')
                    .eq('lor_id', lorId)
                    .range(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE - 1)
            );
        }

        const chunkResults = await Promise.all(fetchPromises);
        let allData: any[] = [];

        chunkResults.forEach(({ data, error }) => {
            if (error) {
                console.error('Error fetching business chunk:', error);
            } else if (data) {
                allData = [...allData, ...data];
            }
        });

        // Map to the expected format
        const formattedData = allData.map(d => ({
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
